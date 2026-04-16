import { Timestamp } from 'firebase/firestore';

/**
 * Safely parses a date from various formats (string, Firestore Timestamp, or Date object)
 */
export function parseSafeDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  
  // Handle Firestore Timestamp
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // Handle Timestamp-like objects { seconds, nanoseconds }
  if (dateValue.seconds !== undefined && dateValue.nanoseconds !== undefined) {
    return new Timestamp(dateValue.seconds, dateValue.nanoseconds).toDate();
  }
  
  // Handle string or number
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date value encountered:', dateValue);
    return new Date();
  }
  
  return date;
}
