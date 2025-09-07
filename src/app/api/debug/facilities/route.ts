import { mongoConnect } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await mongoConnect();
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Try to find facilities collection
    let facilities = [];
    if (collectionNames.includes('facilities')) {
      const facilitiesCollection = mongoose.connection.db.collection('facilities');
      facilities = await facilitiesCollection.find({}).toArray();
    }
    
    return NextResponse.json({
      success: true,
      collections: collectionNames,
      totalFacilities: facilities.length,
      facilities: facilities.map(f => ({
        id: f._id.toString(),
        name: f.name,
        city: f.city,
        province: f.province
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