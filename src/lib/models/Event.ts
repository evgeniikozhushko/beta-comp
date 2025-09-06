// models/Event.ts
import mongoose, { Schema, Document, model, models, Types } from "mongoose";

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
  registrationDeadline: Date; // last date to sign up

  // Optional extras
  imageUrl?: string; // URL to banner/photo
  description?: string; // longer event details
  maxParticipants?: number; // cap on registrants
  entryFee?: number; // e.g. in cents or decimals
  contactEmail?: string; // event organizer
  attendies?: Types.ObjectId[]; // list of attendees

  // Registration-related fields
  maxCapacity?: number; // 0 means unlimited
  allowRegistration?: boolean;
  registrationCount?: number;
  waitlistCount?: number;

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

    maxParticipants: { type: Number, min: 1 },
    entryFee: { type: Number, min: 0 },
    contactEmail: { type: String, lowercase: true, match: /.+@.+\..+/ },
    
    attendies: {
      type: [Schema.Types.ObjectId]
    },

    // New registration-related fields
    maxCapacity: {
      type: Number,
      default: 0, // 0 means unlimited
      min: 0
    },
    registrationDeadline: {
      type: Date,
      required: false // Optional - if not set, registration open until event start
    },
    allowRegistration: {
      type: Boolean,
      default: true
    },
    registrationCount: {
      type: Number,
      default: 0,
      min: 0
    },
    waitlistCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Add these methods to your Event schema before export
EventSchema.methods.isRegistrationOpen = function() {
  if (!this.allowRegistration) return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  return true;
};

EventSchema.methods.hasCapacity = function() {
  if (this.maxCapacity === 0) return true; // Unlimited capacity
  return this.registrationCount < this.maxCapacity;
};

EventSchema.methods.getRegistrationStatus = function() {
  if (!this.isRegistrationOpen()) return 'closed';
  if (!this.hasCapacity()) return 'full';
  return 'open';
};

// Method to update registration count
EventSchema.methods.updateRegistrationCount = async function() {
  const Registration = models.Registration || mongoose.model('Registration');
  const count = await Registration.countDocuments({
    eventId: this._id,
    status: 'registered'
  });
  const waitlistCount = await Registration.countDocuments({
    eventId: this._id,
    status: 'waitlisted'
  });

  this.registrationCount = count;
  this.waitlistCount = waitlistCount;
  await this.save();

  return { registrationCount: count, waitlistCount };
};

// Prevent model recompilation in dev
export default models.Event || model<IEvent>("Event", EventSchema);