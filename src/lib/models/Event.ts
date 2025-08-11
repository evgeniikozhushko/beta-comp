// models/Event.ts
import { Schema, Document, model, models, Types } from "mongoose";

export interface IEvent extends Document {
  // Required core info
  name: string;
  date: Date; // when the event starts
  durationDays: number; // length of event in days
  facility: Types.ObjectId; // → reference to a Facility collection
  discipline: "Boulder" | "Lead" | "Speed";
  ageCategories: string[]; // e.g. ["U12", "U18", "Open"]
  division: "Male" | "Female" | "Mixed";
  createdBy: Types.ObjectId; // → reference to User who created event

  // Optional extras
  imageUrl?: string; // URL to banner/photo
  description?: string; // longer event details
  registrationDeadline?: Date; // last date to sign up
  maxParticipants?: number; // cap on registrants
  entryFee?: number; // e.g. in cents or decimals
  contactEmail?: string; // event organizer

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    durationDays: { type: Number, required: true, min: 1 },

    facility: { type: Schema.Types.ObjectId, ref: "Facility", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    discipline: {
      type: String,
      required: true,
      enum: ["Boulder", "Lead", "Speed"],
    },

    ageCategories: {
      type: [String],
      required: true,
      validate: [
        (arr: string[]) => arr.length > 0,
        "At least one age category",
      ],
    },

    division: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Mixed"],
    },

    imageUrl: { type: String },
    description: { type: String },

    registrationDeadline: { type: Date },
    maxParticipants: { type: Number, min: 1 },
    entryFee: { type: Number, min: 0 },
    contactEmail: { type: String, lowercase: true, match: /.+@.+\..+/ },
  },
  { timestamps: true }
);

// Prevent model recompilation in dev
export default models.Event || model<IEvent>("Event", EventSchema);
