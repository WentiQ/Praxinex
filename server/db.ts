import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export interface DBStore {
  merchant: any | null;
  policies: any | null;
  autoTrafficState: any | null;
  mostRecentCaseId: string | null;
  cases: any[];
  customers: any[];
  activities: any[];
  payments: any[];
}

class DatabaseManager {
  private supabase: SupabaseClient | null = null;
  private isSupabaseActive: boolean = false;
  private guestMemoryCache: DBStore = {
    merchant: null,
    policies: null,
    autoTrafficState: null,
    mostRecentCaseId: null,
    cases: [],
    customers: [],
    activities: [],
    payments: []
  };

  constructor() {
    let supabaseUrl = (
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      'https://utkaitqddahefbgnwbmv.supabase.co'
    ).trim();
    const supabaseKey = (
      process.env.SUPABASE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      'sb_publishable_kYYhHqmkD5omxM8M2_Nreg_qAyV_lZU'
    ).trim();

    // Clean URL if trailing /rest/v1 or slashes were included
    if (supabaseUrl) {
      supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
    }

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isSupabaseActive = true;
        console.log(`⚡ Connected directly to Supabase PostgreSQL cloud database (${supabaseUrl})`);
      } catch (err: any) {
        console.error('⚠️ Supabase connection error:', err.message);
      }
    } else {
      console.warn('⚠️ Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_KEY.');
    }
  }

  // --- Merchant Settings ---
  async getMerchant(userId?: string): Promise<any | null> {
    if (this.isSupabaseActive && this.supabase) {
      try {
        if (userId) {
          // 1. Direct ID match
          const { data: directData, error: directError } = await this.supabase
            .from('merchant_settings')
            .select('*')
            .eq('id', userId)
            .single();
          if (directData && !directError && directData.profile) {
            return directData.profile;
          }

          // 2. Lookup by email / user link in profile
          const { data: allMerchants } = await this.supabase
            .from('merchant_settings')
            .select('*')
            .not('id', 'in', '("recovery_policies","auto_traffic_state","most_recent_case_id","default_merchant")')
            .order('updated_at', { ascending: false });
          
          if (allMerchants && allMerchants.length > 0) {
            const cleanUser = userId.toLowerCase().trim();
            const matched = allMerchants.find(m => 
              m.id.toLowerCase() === cleanUser || 
              (m.profile && (
                m.profile.id?.toLowerCase() === cleanUser || 
                m.profile.email?.toLowerCase() === cleanUser ||
                m.profile.userId?.toLowerCase() === cleanUser
              ))
            );
            if (matched && matched.profile) {
              return matched.profile;
            }
            // If user is authenticated and there is a saved merchant profile, fallback to it
            if (allMerchants.length === 1 && allMerchants[0].profile) {
              return allMerchants[0].profile;
            }
          }
          return null;
        } else {
          // Guest / Unauthenticated: strictly null
          return null;
        }
      } catch (err: any) {
        console.error('Supabase getMerchant error:', err.message);
      }
    }
    return userId ? null : this.guestMemoryCache.merchant;
  }

  async getAllMerchants(): Promise<any[]> {
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('merchant_settings')
          .select('*')
          .not('id', 'in', '("recovery_policies","auto_traffic_state","most_recent_case_id")')
          .order('updated_at', { ascending: false });
        if (data && !error && data.length > 0) {
          return data.map(d => d.profile).filter(p => p && (p.razorpayKeyId || p.businessName));
        }
      } catch (err: any) {
        console.error('Supabase getAllMerchants error:', err.message);
      }
    }
    return this.guestMemoryCache.merchant ? [this.guestMemoryCache.merchant] : [];
  }

  async saveMerchant(profile: any, userId?: string): Promise<void> {
    const merchantId = userId || 'default_merchant';
    if (!userId) {
      this.guestMemoryCache.merchant = profile;
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        const { error } = await this.supabase.from('merchant_settings').upsert({
          id: merchantId,
          profile,
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.error('Supabase merchant upsert error:', error.message);
        }
      } catch (err: any) {
        console.error('Supabase merchant upsert exception:', err.message);
      }
    }
  }

  // --- Recovery Policies ---
  async getPolicies(userId?: string): Promise<any | null> {
    const policyId = userId ? `recovery_policies_${userId}` : 'recovery_policies';
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('merchant_settings')
          .select('*')
          .eq('id', policyId)
          .single();
        if (data && !error && data.profile) return data.profile;

        // Fallback to default template if user-specific policy does not exist yet
        if (userId) {
          const defaultRes = await this.supabase
            .from('merchant_settings')
            .select('*')
            .eq('id', 'recovery_policies')
            .single();
          if (defaultRes.data && !defaultRes.error && defaultRes.data.profile) {
            return defaultRes.data.profile;
          }
        }
      } catch {}
    }
    return this.guestMemoryCache.policies;
  }

  async savePolicies(policy: any, userId?: string): Promise<void> {
    const policyId = userId ? `recovery_policies_${userId}` : 'recovery_policies';
    if (!userId) {
      this.guestMemoryCache.policies = policy;
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        const { error } = await this.supabase.from('merchant_settings').upsert({
          id: policyId,
          profile: policy,
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.error('Supabase policies upsert error:', error.message);
        }
      } catch (err: any) {
        console.error('Supabase policies upsert exception:', err.message);
      }
    }
  }

  // --- Auto Traffic Engine State Persistence ---
  async getAutoTrafficState(userId?: string): Promise<any | null> {
    const stateId = userId ? `auto_traffic_state_${userId}` : 'auto_traffic_state';
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('merchant_settings')
          .select('*')
          .eq('id', stateId)
          .single();
        if (data && !error && data.profile) return data.profile;
      } catch {}
    }
    return this.guestMemoryCache.autoTrafficState;
  }

  async saveAutoTrafficState(state: any, userId?: string): Promise<void> {
    const stateId = userId ? `auto_traffic_state_${userId}` : 'auto_traffic_state';
    if (!userId) {
      this.guestMemoryCache.autoTrafficState = state;
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        await this.supabase.from('merchant_settings').upsert({
          id: stateId,
          profile: state,
          updated_at: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn('Supabase auto_traffic_state upsert error:', err.message);
      }
    }
  }

  // --- Recency Sentinel Persistence ---
  async getMostRecentCaseId(userId?: string): Promise<string | null> {
    const id = userId ? `most_recent_case_id_${userId}` : 'most_recent_case_id';
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('merchant_settings')
          .select('*')
          .eq('id', id)
          .single();
        if (data && !error && data.profile?.caseId) return data.profile.caseId;
      } catch {}
    }
    return this.guestMemoryCache.mostRecentCaseId || null;
  }

  async saveMostRecentCaseId(caseId: string, userId?: string): Promise<void> {
    const id = userId ? `most_recent_case_id_${userId}` : 'most_recent_case_id';
    if (!userId) {
      this.guestMemoryCache.mostRecentCaseId = caseId;
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        await this.supabase.from('merchant_settings').upsert({
          id,
          profile: { caseId, updatedAt: new Date().toISOString() },
          updated_at: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn('Supabase most_recent_case_id upsert error:', err.message);
      }
    }
  }

  // --- Recovery Cases ---
  async getCases(userId?: string): Promise<any[]> {
    if (!userId) {
      // Unauthenticated / Signed-out state: strictly return empty array
      return [];
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        const query = this.supabase
          .from('recovery_cases')
          .select('*')
          .order('updated_at', { ascending: false });

        const { data, error } = await query;
        if (data && !error && data.length > 0) {
          const cases = data.map(d => d.case_data);
          // Strictly return ONLY this authenticated user's cases
          return cases.filter((c: any) => c && c.userId === userId);
        }
      } catch (err: any) {
        console.error('Supabase getCases error:', err.message);
      }
    }
    return [];
  }

  async upsertCase(caseItem: any, userId?: string): Promise<void> {
    caseItem.userId = userId || caseItem.userId || 'guest';
    if (!userId) {
      const idx = this.guestMemoryCache.cases.findIndex(c => c.id === caseItem.id);
      if (idx >= 0) {
        this.guestMemoryCache.cases[idx] = caseItem;
      } else {
        this.guestMemoryCache.cases.unshift(caseItem);
      }
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        await this.supabase.from('recovery_cases').upsert({
          id: caseItem.id,
          customer_name: caseItem.customerName,
          amount: caseItem.amount,
          status: caseItem.status,
          case_data: caseItem,
          updated_at: new Date().toISOString()
        });
      } catch (err: any) {
        console.error('Supabase case upsert error:', err.message);
      }
    }
  }

  async saveCases(cases: any[], replaceAll: boolean = true, userId?: string): Promise<void> {
    const effectiveUserId = userId || 'guest';
    cases.forEach(c => { if (c) c.userId = effectiveUserId; });

    if (!userId) {
      if (replaceAll) {
        this.guestMemoryCache.cases = cases;
      } else {
        const existingMap = new Map<string, any>();
        for (const c of this.guestMemoryCache.cases) {
          if (c && c.id) existingMap.set(c.id, c);
        }
        for (const c of cases) {
          if (c && c.id) {
            const existing = existingMap.get(c.id);
            existingMap.set(c.id, { ...existing, ...c });
          }
        }
        this.guestMemoryCache.cases = Array.from(existingMap.values());
      }
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        if (cases.length > 0) {
          const rows = cases.map(c => ({
            id: c.id,
            customer_name: c.customerName,
            amount: c.amount,
            status: c.status,
            case_data: c,
            updated_at: new Date().toISOString()
          }));
          await this.supabase.from('recovery_cases').upsert(rows);
        }
      } catch (err: any) {
        console.error('Supabase bulk cases sync error:', err.message);
      }
    }
  }

  async clearAllData(userId?: string): Promise<void> {
    if (!userId) {
      this.guestMemoryCache.cases = [];
      this.guestMemoryCache.payments = [];
      this.guestMemoryCache.activities = [];
    }
  }

  // --- Activities Audit Trail ---
  async getActivities(userId?: string): Promise<any[]> {
    if (!userId) {
      // Unauthenticated / Signed-out state: strictly return empty array
      return [];
    }

    let list: any[] = [];
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('activity_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);
        if (data && !error && data.length > 0) {
          list = data.map(d => d.activity_data);
          // Strictly return ONLY this user's activities
          list = list.filter((act: any) => act && act.userId === userId);
        }
      } catch (err: any) {
        console.error('Supabase getActivities error:', err.message);
      }
    } else {
      list = [];
    }

    // Strictly filter out simulation intake placeholders — show only actions taken after creation
    return (list || []).filter(act => 
      !act.id?.startsWith('act-sim-') && 
      act.eventTitle !== 'Revenue risk detected' && 
      !act.eventTitle?.startsWith('Revenue risk:') &&
      act.result !== 'Ingested into active recovery queue'
    );
  }

  async addActivity(activity: any, userId?: string): Promise<void> {
    activity.userId = userId || activity.userId || 'guest';
    if (!userId) {
      if (!this.guestMemoryCache.activities.some(a => a.id === activity.id)) {
        this.guestMemoryCache.activities.unshift(activity);
        if (this.guestMemoryCache.activities.length > 300) {
          this.guestMemoryCache.activities = this.guestMemoryCache.activities.slice(0, 300);
        }
      }
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        await this.supabase.from('activity_logs').upsert({
          id: activity.id,
          case_id: activity.caseId,
          event_title: activity.eventTitle,
          amount: activity.amount,
          result_status: activity.resultStatus,
          timestamp: activity.timestamp || new Date().toISOString(),
          activity_data: activity
        });
      } catch (err: any) {
        console.error('Supabase activity insert error:', err.message);
      }
    }
  }

  async saveActivities(activities: any[], userId?: string): Promise<void> {
    const effectiveUserId = userId || 'guest';
    activities.forEach(a => { if (a) a.userId = effectiveUserId; });
    if (!userId) {
      this.guestMemoryCache.activities = activities || [];
    }

    if (this.isSupabaseActive && this.supabase && activities.length > 0) {
      try {
        const rows = activities.slice(0, 100).map(a => ({
          id: a.id,
          case_id: a.caseId || '',
          event_title: a.eventTitle || 'Action',
          amount: a.amount || 0,
          result_status: a.resultStatus || 'info',
          timestamp: a.timestamp || new Date().toISOString(),
          activity_data: a
        }));
        await this.supabase.from('activity_logs').upsert(rows);
      } catch (err: any) {
        console.error('Supabase bulk activities upsert error:', err.message);
      }
    }
  }

  // --- Payments Ledger ---
  async getPayments(userId?: string): Promise<any[]> {
    if (!userId) {
      // Unauthenticated / Signed-out state: strictly return empty array
      return [];
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments_ledger')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);
        if (data && !error && data.length > 0) {
          const payments = data.map(d => d.payment_data);
          // Strictly return ONLY this user's payments
          return payments.filter((p: any) => p && p.userId === userId);
        }
      } catch (err: any) {
        console.error('Supabase getPayments error:', err.message);
      }
    }
    return [];
  }

  async addPayment(payment: any, userId?: string): Promise<void> {
    payment.userId = userId || payment.userId || 'guest';
    if (!userId) {
      if (!this.guestMemoryCache.payments.some(p => p.id === payment.id || (p.razorpayPaymentId && p.razorpayPaymentId === payment.razorpayPaymentId))) {
        this.guestMemoryCache.payments.unshift(payment);
        if (this.guestMemoryCache.payments.length > 300) {
          this.guestMemoryCache.payments = this.guestMemoryCache.payments.slice(0, 300);
        }
      }
    }

    if (this.isSupabaseActive && this.supabase) {
      try {
        await this.supabase.from('payments_ledger').upsert({
          id: payment.id,
          razorpay_payment_id: payment.razorpayPaymentId,
          customer_name: payment.customerName,
          amount: payment.amount,
          status: payment.status,
          timestamp: payment.isoTimestamp || new Date().toISOString(),
          payment_data: payment
        });
      } catch (err: any) {
        console.error('Supabase payment insert error:', err.message);
      }
    }
  }

  async savePayments(payments: any[], userId?: string): Promise<void> {
    const effectiveUserId = userId || 'guest';
    payments.forEach(p => { if (p) p.userId = effectiveUserId; });
    if (!userId) {
      this.guestMemoryCache.payments = payments || [];
    }

    if (this.isSupabaseActive && this.supabase && payments.length > 0) {
      try {
        const rows = payments.map(p => ({
          id: p.id,
          razorpay_payment_id: p.razorpayPaymentId || p.id,
          customer_name: p.customerName || 'Customer',
          amount: p.amount || 0,
          status: p.status || 'succeeded',
          timestamp: p.isoTimestamp || new Date().toISOString(),
          payment_data: p
        }));
        await this.supabase.from('payments_ledger').upsert(rows);
      } catch (err: any) {
        console.error('Supabase bulk payments upsert error:', err.message);
      }
    }
  }

  getStatus(): { isSupabase: boolean; storagePath: string } {
    return {
      isSupabase: this.isSupabaseActive,
      storagePath: 'Supabase PostgreSQL Cloud (Direct Database Persistence)'
    };
  }
}

export const db = new DatabaseManager();
