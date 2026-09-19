import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

/**
 * Format timestamp into clean conversational relative string.
 * 
 * Examples:
 * - Today: "10:45 AM"
 * - Yesterday: "Yesterday"
 * - This week: "Wednesday"
 * - Older: "9/15/26"
 * 
 * @see https://date-fns.org/docs/format
 */
export function formatConversationTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) {
    return format(date, 'p'); // e.g. 10:45 AM
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  if (isThisWeek(date, { weekStartsOn: 1 })) {
    return format(date, 'EEEE'); // e.g. Wednesday
  }

  return format(date, 'M/d/yy'); // e.g. 9/18/26
}
