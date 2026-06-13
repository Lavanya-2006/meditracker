import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

export const formatDate = (date, fmt = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch { return 'N/A'; }
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy hh:mm a');
  } catch { return 'N/A'; }
};

export const formatTime = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'hh:mm a');
  } catch { return ''; }
};

export const timeAgo = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return ''; }
};

export const friendlyDate = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isToday(d)) return 'Today ' + format(d, 'hh:mm a');
    if (isTomorrow(d)) return 'Tomorrow ' + format(d, 'hh:mm a');
    return format(d, 'MMM dd, hh:mm a');
  } catch { return ''; }
};

export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase() || '?';
};

export const getFrequencyLabel = (freq) => {
  const map = {
    once_daily: 'Once Daily',
    twice_daily: 'Twice Daily',
    three_times_daily: '3x Daily',
    four_times_daily: '4x Daily',
    every_6_hours: 'Every 6 hrs',
    every_8_hours: 'Every 8 hrs',
    every_12_hours: 'Every 12 hrs',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    as_needed: 'As Needed'
  };
  return map[freq] || freq;
};

export const getDosageLabel = (dosage) => {
  if (!dosage) return '';
  return `${dosage.amount} ${dosage.unit}`;
};

export const getAdherenceColor = (rate) => {
  if (rate >= 80) return '#10b981';
  if (rate >= 60) return '#f59e0b';
  return '#ef4444';
};

export const truncate = (str, len = 60) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};

export const MEDICINE_COLORS = [
  '#4F6EF7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'
];

export const getStatusBadgeClass = (status) => {
  const map = { taken: 'badge-success', missed: 'badge-danger', pending: 'badge-warning', skipped: 'badge-secondary' };
  return map[status] || 'badge-secondary';
};
