/**
 * Format currency in Indian Rupee format (e.g. ₹2,48,500)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Format date string into human readable time
 */
export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recent';
  }
}

/**
 * Accurately calculate relative time elapsed since the case was last updated
 */
export function formatCaseTimeAgo(c: any): string {
  if (!c) return 'Just now';

  let latestTimestampMs = 0;

  // 1. Check latest timeline item timestamp
  if (Array.isArray(c.timeline) && c.timeline.length > 0) {
    c.timeline.forEach((t: any) => {
      if (t && t.timestamp) {
        const ms = new Date(t.timestamp).getTime();
        if (!isNaN(ms) && ms > latestTimestampMs) {
          latestTimestampMs = ms;
        }
      }
    });
  }

  // 2. Check updatedAt / createdAt
  if (!latestTimestampMs && c.updatedAt) {
    const ms = new Date(c.updatedAt).getTime();
    if (!isNaN(ms)) latestTimestampMs = ms;
  }
  if (!latestTimestampMs && c.createdAt) {
    const ms = new Date(c.createdAt).getTime();
    if (!isNaN(ms)) latestTimestampMs = ms;
  }

  if (!latestTimestampMs) {
    return c.updated || 'Just now';
  }

  const now = Date.now();
  const diffSec = Math.floor((now - latestTimestampMs) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1m ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 7200) return '1h ago';
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  const d = new Date(latestTimestampMs);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/**
 * Format timestamp into exact readable Date and Time (e.g. "28 Aug 2026, 12:45 PM")
 */
export function formatTimelineDateTime(timestamp?: string, fallback?: string): string {
  if (!timestamp) return fallback || '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return fallback || timestamp;

    const dateStr = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });

    const timeStr = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `${dateStr}, ${timeStr}`;
  } catch {
    return fallback || timestamp;
  }
}

/**
 * Formats any timing value, ISO string, or relative descriptor into an EXACT Date and Time string (e.g. "Aug 31, 2026, 09:30 AM")
 * Never returns conversational statements or fuzzy phrases like "Early morning" or "Immediate dispatch".
 */
export function formatExactTiming(timingValue?: string | null, caseItem?: any): string {
  const now = new Date();
  
  // 1. If caseItem has explicit scheduledRetry.scheduledAt
  if (caseItem?.scheduledRetry?.scheduledAt) {
    const d = new Date(caseItem.scheduledRetry.scheduledAt);
    if (!isNaN(d.getTime())) {
      return formatDateTimeString(d);
    }
  }

  // 2. If caseItem has explicit responseWindowDeadline
  if (caseItem?.responseWindowDeadline) {
    const d = new Date(caseItem.responseWindowDeadline);
    if (!isNaN(d.getTime())) {
      return formatDateTimeString(d);
    }
  }

  // 3. If timingValue is passed and is already a valid parseable date
  if (timingValue && !isNaN(new Date(timingValue).getTime()) && timingValue.length >= 10 && (timingValue.includes('-') || timingValue.includes('/') || timingValue.includes(','))) {
    return formatDateTimeString(new Date(timingValue));
  }

  // 4. If timingValue contains identifiable time strings (e.g. "09:30 AM", "10:00 AM", "15m", etc.)
  if (timingValue) {
    const lower = timingValue.toLowerCase();
    if (lower.includes('15m') || lower.includes('15 min')) {
      return formatDateTimeString(new Date(now.getTime() + 15 * 60 * 1000));
    }
    if (lower.includes('45m') || lower.includes('45 min')) {
      return formatDateTimeString(new Date(now.getTime() + 45 * 60 * 1000));
    }
    if (lower.includes('5-10m') || lower.includes('10m')) {
      return formatDateTimeString(new Date(now.getTime() + 10 * 60 * 1000));
    }
    if (lower.includes('1 hour') || lower.includes('1h')) {
      return formatDateTimeString(new Date(now.getTime() + 60 * 60 * 1000));
    }
    if (lower.includes('09:30 am') || lower.includes('9:30 am') || lower.includes('morning')) {
      const d = new Date(now.getTime());
      d.setHours(9, 30, 0, 0);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
      return formatDateTimeString(d);
    }
    if (lower.includes('10:00 am')) {
      const d = new Date(now.getTime());
      d.setHours(10, 0, 0, 0);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
      return formatDateTimeString(d);
    }
    if (lower.includes('11:00 am')) {
      const d = new Date(now.getTime());
      d.setHours(11, 0, 0, 0);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
      return formatDateTimeString(d);
    }
    if (lower.includes('immediate') || lower.includes('instant')) {
      return formatDateTimeString(new Date(now.getTime() + 2 * 60 * 1000));
    }
  }

  // 5. Fallback based on recommended action
  const action = (caseItem?.recommendedAction || caseItem?.llmDiagnosis?.recommendedAction || '').toLowerCase();
  if (action.includes('schedule')) {
    const d = new Date(now.getTime());
    d.setHours(9, 30, 0, 0);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return formatDateTimeString(d);
  }
  if (action.includes('retry')) {
    return formatDateTimeString(new Date(now.getTime() + 15 * 60 * 1000));
  }
  if (action.includes('escalat')) {
    return formatDateTimeString(new Date(now.getTime() + 2 * 3600 * 1000));
  }

  // Default: +24 hours
  const hours = caseItem?.responseWindowHours || caseItem?.llmDiagnosis?.responseWindowHours || 24;
  return formatDateTimeString(new Date(now.getTime() + hours * 3600 * 1000));
}

function formatDateTimeString(d: Date): string {
  return d.toLocaleString('en-IN', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}


