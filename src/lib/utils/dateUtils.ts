/**
 * Date utility functions for handling deadlines and date comparisons
 */

/**
 * Checks if the current UTC date is after the given deadline date.
 * This performs a date-only comparison, ignoring time components.
 *
 * @param deadlineDate - The deadline date to compare against
 * @returns true if current UTC date is after the deadline date
 *
 * @example
 * // Deadline is Oct 16, 2025 at midnight UTC
 * // Current time is Oct 16, 2025 at 11:59 PM UTC
 * isAfterDeadline(new Date('2025-10-16T00:00:00.000Z')) // false (same day)
 *
 * // Current time is Oct 17, 2025 at 12:01 AM UTC
 * isAfterDeadline(new Date('2025-10-16T00:00:00.000Z')) // true (next day)
 */
export function isAfterDeadline(deadlineDate: Date | string): boolean {
  // Get current date in UTC as YYYY-MM-DD
  const todayUTC = new Date().toISOString().split('T')[0];

  // Get deadline date in UTC as YYYY-MM-DD
  const deadlineUTC = new Date(deadlineDate).toISOString().split('T')[0];

  // Compare dates as strings (works because of YYYY-MM-DD format)
  return todayUTC > deadlineUTC;
}

/**
 * Gets the current UTC date as a YYYY-MM-DD string
 */
export function getCurrentUTCDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Converts a Date object to UTC date string (YYYY-MM-DD)
 */
export function toUTCDateString(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0];
}
