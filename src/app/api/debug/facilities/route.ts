import { mongoConnect } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

interface FacilityDocument {
  _id: unknown;
  name?: string;
  city?: string;
  province?: string;
}

export async function GET() {
  try {
    await mongoConnect();
    
    // Check if db connection exists
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Try to find facilities collection
    let facilities: FacilityDocument[] = [];
    if (collectionNames.includes('facilities')) {
      const facilitiesCollection = mongoose.connection.db.collection('facilities');
      facilities = await facilitiesCollection.find({}).toArray() as FacilityDocument[];
    }
    
    return NextResponse.json({
      success: true,
      collections: collectionNames,
      totalFacilities: facilities.length,
      facilities: facilities.map(f => ({
        id: String(f._id),
        name: f.name || 'Unknown',
        city: f.city || 'Unknown',
        province: f.province || 'Unknown'
      }))
    });
    
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}