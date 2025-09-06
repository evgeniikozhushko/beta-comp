import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegistration extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    eventId: Types.ObjectId;
    registeredAt: Date;
    status: 'registered' | 'waitlisted' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    registeredAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['registered', 'waitlisted', 'cancelled'],
        default: 'registered',
        required: true
    }
}, {
    timestamps: true,
    collection: 'registrations'
});

// Compound index to prevent duplicate registrations
RegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Index for efficient queries
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ userId: 1, status: 1 });

// Static method to get registration count for an event
RegistrationSchema.statics.getEventRegistrationCount = function (eventId: Types.ObjectId, status = 'registered') {
    return this.countDocuments({ eventId, status });
};

// Static method to check if user is registered for event
RegistrationSchema.statics.isUserRegistered = function (userId: Types.ObjectId, eventId: Types.ObjectId) {
    return this.findOne({ userId, eventId, status: 'registered' });
};

// Static method to get user's registrations
RegistrationSchema.statics.getUserRegistrations = function (userId: Types.ObjectId, status?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId };
    if (status) query.status = status;

    return this.find(query)
        .populate('eventId')
        .sort({ registeredAt: -1 });
};

// Static method to get event registrations with user details
RegistrationSchema.statics.getEventRegistrations = function (eventId: Types.ObjectId, status?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { eventId };
    if (status) query.status = status;

    return this.find(query)
        .populate('userId', 'displayName email picture')
        .sort({ registeredAt: 1 });
};

const Registration = mongoose.models.Registration || mongoose.model<IRegistration>('Registration',
    RegistrationSchema);

export default Registration;