import { Types } from 'mongoose';

/**
 * Deeply serializes Mongoose objects to plain objects suitable for client components
 * Handles ObjectIds, Dates, and nested objects recursively
 */
export function serializeMongooseObject<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle ObjectId
  if (obj instanceof Types.ObjectId || (obj && obj._bsontype === 'ObjectId')) {
    return obj.toString() as any;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeMongooseObject(item)) as any;
  }

  // Handle Objects (including Mongoose documents)
  if (typeof obj === 'object' && obj !== null) {
    const serialized: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip Mongoose-specific properties
        if (key.startsWith('_') && key !== '_id') {
          continue;
        }
        if (key === '__v' || key === '$__' || key === 'isNew') {
          continue;
        }
        
        serialized[key] = serializeMongooseObject(obj[key]);
      }
    }
    
    return serialized;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Serializes an array of Mongoose documents
 */
export function serializeMongooseArray<T = any>(arr: any[]): T[] {
  return arr.map(item => serializeMongooseObject<T>(item));
}

/**
 * Type-safe serialization for Event objects
 */
export interface SerializedEvent {
  _id: string;
  name: string;
  date: string;
  durationDays: number;
  facility: any;
  discipline: string;
  ageCategories: string[];
  division: string;
  description?: string;
  registrationDeadline?: string;
  maxCapacity?: number;
  registrationCount?: number;
  allowRegistration?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type-safe serialization for Facility objects
 */
export interface SerializedFacility {
  _id: string;
  name: string;
  city?: string;
  province: string;
  country: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serializes Event documents specifically
 */
export function serializeEvent(event: any): SerializedEvent {
  return serializeMongooseObject<SerializedEvent>(event);
}

/**
 * Serializes Facility documents specifically
 */
export function serializeFacility(facility: any): SerializedFacility {
  return serializeMongooseObject<SerializedFacility>(facility);
}