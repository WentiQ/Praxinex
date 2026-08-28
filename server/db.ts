import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface DBStore {
  merchant: any | null;
  cases: any[];
  activities: any[];
  payments: any[];
}

const LOCAL_STORE_PATH = path.resolve(process.cwd(), 'data', 'platform_store.json');

// Ensure data directory exists
const dataDir = path.dirname(LOCAL_STORE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class DatabaseManager {
  private supabase: SupabaseClient | null = null;
  private isSupabaseActive: boolean = false;
  private localCache: DBStore = {
    merchant: null,
    cases: [],
    activities: [],
    payments: []
  };

  constructor() {
    let supabaseUrl = (
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      ''
    ).trim();
    const supabaseKey = (
      process.env.SUPABASE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ''
    ).trim();

    // Clean URL if trailing /rest/v1 or slashes were included
    if (supabaseUrl) {
      supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
    }

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isSupabaseActive = true;
        console.log(`⚡ Connected to Supabase PostgreSQL database (${supabaseUrl})`);
      } catch (err: any) {
        console.warn('⚠️ Supabase connection failed, falling back to local persistent store:', err.message);
        this.initLocalStore();
      }
    } else {
      console.log('📦 Supabase credentials not found; utilizing local disk persistence (data/platform_store.json)');
      this.initLocalStore();
    }
  }

  private initLocalStore() {
    try {
      if (fs.existsSync(LOCAL_STORE_PATH)) {
        const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.localCache = {
          merchant: parsed.merchant || null,
          cases: Array.isArray(parsed.cases) ? parsed.cases : [],
          activities: Array.isArray(parsed.activities) ? parsed.activities : [],
          payments: Array.isArray(parsed.payments) ? parsed.payments : []
        };
      } else {
        this.persistLocalStore();
      }
    } catch (err: any) {
      console.warn('Could not read local store, starting fresh:', err.message);
      this.persistLocalStore();
    }
  }

  private persistLocalStore() {
    if (this.isSupabaseActive) return; // No disk writes when Supabase is active
    try {
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(this.localCache, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('Error persisting to local store:', err.message);
    }
  }

  // --- Merchant Settings ---
  async getMerchant(): Promise<any | null> {
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('merchant_settings')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        if (data && !error) return data.profile;
      } catch {}
    }
    return this.localCache.merchant;
  }

  async saveMerchant(profile: any): Promise<void> {
    this.localCache.merchant = profile;
    this.persistLocalStore();

    if (this.isSupabaseActive && this.supabase) {
      try {
        await this.supabase.from('merchant_settings').upsert({
          id: profile.id || 'default_merchant',
          profile,
          updated_at: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn('Supabase merchant upsert error:', err.message);
      }
    }
  }

  // --- Recovery Cases ---
  async getCases(): Promise<any[]> {
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('recovery_cases')
          .select('*')
          .order('updated_at', { ascending: false });
        if (data && !error && data.length > 0) {
          return data.map(d => d.case_data);
        }
      } catch {}
    }
    return this.localCache.cases;
  }

  async upsertCase(caseItem: any): Promise<void> {
    const idx = this.localCache.cases.findIndex(c => c.id === caseItem.id);
    if (idx >= 0) {
      this.localCache.cases[idx] = caseItem;
    } else {
      this.localCache.cases.unshift(caseItem);
    }
    this.persistLocalStore();

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
        console.warn('Supabase case upsert error:', err.message);
      }
    }
  }

  async saveCases(cases: any[]): Promise<void> {
    this.localCache.cases = cases;
    this.persistLocalStore();

    if (this.isSupabaseActive && this.supabase && cases.length > 0) {
      try {
        const rows = cases.map(c => ({
          id: c.id,
          customer_name: c.customerName,
          amount: c.amount,
          status: c.status,
          case_data: c,
          updated_at: new Date().toISOString()
        }));
        await this.supabase.from('recovery_cases').upsert(rows);
      } catch (err: any) {
        console.warn('Supabase bulk cases upsert error:', err.message);
      }
    }
  }

  // --- Activities Audit Trail ---
  async getActivities(): Promise<any[]> {
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('activity_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);
        if (data && !error && data.length > 0) {
          return data.map(d => d.activity_data);
        }
      } catch {}
    }
    return this.localCache.activities;
  }

  async addActivity(activity: any): Promise<void> {
    // Avoid duplicate activities by ID
    if (!this.localCache.activities.some(a => a.id === activity.id)) {
      this.localCache.activities.unshift(activity);
      // Keep recent 300 activities
      if (this.localCache.activities.length > 300) {
        this.localCache.activities = this.localCache.activities.slice(0, 300);
      }
      this.persistLocalStore();
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
        console.warn('Supabase activity insert error:', err.message);
      }
    }
  }

  // --- Payments Ledger ---
  async getPayments(): Promise<any[]> {
    if (this.isSupabaseActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments_ledger')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);
        if (data && !error && data.length > 0) {
          return data.map(d => d.payment_data);
        }
      } catch {}
    }
    return this.localCache.payments;
  }

  async addPayment(payment: any): Promise<void> {
    if (!this.localCache.payments.some(p => p.id === payment.id || (p.razorpayPaymentId && p.razorpayPaymentId === payment.razorpayPaymentId))) {
      this.localCache.payments.unshift(payment);
      if (this.localCache.payments.length > 300) {
        this.localCache.payments = this.localCache.payments.slice(0, 300);
      }
      this.persistLocalStore();
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
        console.warn('Supabase payment insert error:', err.message);
      }
    }
  }

  getStatus(): { isSupabase: boolean; storagePath: string } {
    return {
      isSupabase: this.isSupabaseActive,
      storagePath: this.isSupabaseActive ? 'Supabase PostgreSQL Cloud' : LOCAL_STORE_PATH
    };
  }
}

export const db = new DatabaseManager();
