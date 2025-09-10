import { Types } from 'mongoose';

/**
 * Deeply serializes Mongoose objects to plain objects suitable for client components
 * Handles ObjectIds, Dates, and nested objects recursively
 */
export function serializeMongooseObject<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  // Handle ObjectId
  if (obj instanceof Types.ObjectId || (obj && typeof obj === 'object' && '_bsontype' in obj && obj._bsontype === 'ObjectId')) {
    return obj.toString() as T;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString() as T;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeMongooseObject(item)) as T;
  }

  // Handle Objects (including Mongoose documents)
  if (typeof obj === 'object' && obj !== null) {
    const serialized: Record<string, unknown> = {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip Mongoose-specific properties
        if (key.startsWith('_') && key !== '_id') {
          continue;
        }
        if (key === '__v' || key === '$__' || key === 'isNew') {
          continue;
        }
        
        serialized[key] = serializeMongooseObject((obj as Record<string, unknown>)[key]);
      }
    }
    
    return serialized as T;
  }

  // Return primitive values as-is
  return obj as T;
}

/**
 * Serializes an array of Mongoose documents
 */
export function serializeMongooseArray<T = unknown>(arr: unknown[]): T[] {
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
  facility: {
    _id: string;
    name: string;
    city?: string;
    province: string;
  };
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
export function serializeEvent(event: unknown): SerializedEvent {
  return serializeMongooseObject<SerializedEvent>(event);
}

/**
 * Serializes Facility documents specifically
 */
export function serializeFacility(facility: unknown): SerializedFacility {
  return serializeMongooseObject<SerializedFacility>(facility);
}