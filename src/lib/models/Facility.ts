import { Schema, Document, model, models } from "mongoose";

export interface IFacility extends Document {
  name: string;
  address?: string;
  city: string;
  province: string;
  country: string;
  contactEmail?: string;
  phone?: string;
  website?: string;
  imageUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FacilitySchema = new Schema<IFacility>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    province: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "Canada",
    },
    contactEmail: {
      type: String,
      lowercase: true,
      match: /.+@.+\..+/,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      match: /^https?:\/\/.+\..+/,
    },
    imageUrl: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

FacilitySchema.index({ name: 1, city: 1, province: 1, country: 1 }, { unique: true });

// Prevent model recompilation in dev
export default models.Facility || model<IFacility>("Facility", FacilitySchema);