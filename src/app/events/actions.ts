"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Types } from "mongoose";
import { mongoConnect, withTransaction } from "@/lib/mongodb";
import Event, { IEvent } from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import { auth } from "@/lib/auth";
import { hasPermission, canManageEvent } from "@/lib/types/permissions";
import Registration from '@/lib/models/Registration';
import { isAfterDeadline } from "@/lib/utils/dateUtils";

// Return shape for useActionState
export type CreateEventState =
  | { pending: false; success: true; id: string; name: string }
  | {
    pending: false;
    success?: false;
    error?: string;
    fieldErrors?: Record<string, string>;
    // NEW: echo back what the user submitted so the client can rehydrate fields
    values?: Record<string, unknown>;
  };

export type UpdateEventState =
  | { pending: false; success: true; id: string; name: string }
  | {
    pending: false;
    success?: false;
    error?: string;
    fieldErrors?: Record<string, string>;
    values?: Record<string, unknown>;
  };

export type DeleteEventState =
  | { pending: false; success: true; id: string; name: string }
  | { pending: false; success?: false; error?: string };

// Zod schema for validating event creation payload
const EventCreateSchema = z.object({
  name: z.string().min(1, "Please enter a name").trim(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Please select a valid date",
  }),
  durationDays: z.number().min(1, "Duration must be at least 1 day"),
  facility: z.string().min(1, "Please select a facility"),
  discipline: z.enum(["Boulder", "Lead", "Speed"], {
    message: "Choose a discipline",
  }),
  ageCategories: z.array(z.string()).min(1, "Pick at least one category"),
  division: z.enum(["Male", "Female", "Mixed"], {
    message: "Choose a division",
  }),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  entryFee: z.number().min(0).optional(),
  contactEmail: z.string().email("That doesn't look like an email").optional(),
  registrationDeadline: z.string().optional().
    refine((date) => {
      if (!date) return true; // Optional field, so undefined/empty is valid
      const deadline = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
      return deadline >= today;
    }, {
      message: "Registration deadline must be today or in the future"
    }),
});

export async function createEventAction(
  _prevState: unknown,
  formData: FormData
): Promise<CreateEventState> {
  console.log('🎯 Starting event creation process...');
  
  // 1. Auth guard (no redirect here—return an error for the form)
  console.log('🔐 Checking authentication...');
  const session = await auth();
  if (!session) {
    console.log('❌ Authentication failed - no session');
    return { pending: false, error: "UNAUTHORIZED" };
  }
  
  console.log('✅ Authentication successful:', session.user.displayName, session.user.id);

  // 2. Permission check - user must be able to create events
  console.log('👮 Checking permissions for role:', session.user.role);
  if (!hasPermission(session.user.role, 'canCreateEvents')) {
    console.log('❌ Permission denied for role:', session.user.role);
    return { pending: false, error: "PERMISSION_DENIED" };
  }
  
  console.log('✅ Permission check passed');

  // 2. Extract and normalize raw data from FormData
  console.log('📝 Extracting form data...');
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    date: formData.get("date"),
    durationDays: Number(formData.get("durationDays")),
    facility: formData.get("facility"),
    discipline: formData.get("discipline"),
    ageCategories: formData.getAll("ageCategories"),
    division: formData.get("division"),
    imageUrl: formData.get("imageUrl") || undefined,
    description: formData.get("description") || undefined,
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    maxParticipants: formData.get("maxParticipants")
      ? Number(formData.get("maxParticipants"))
      : undefined,
    entryFee: formData.get("entryFee")
      ? Number(formData.get("entryFee"))
      : undefined,
    contactEmail: formData.get("contactEmail") || undefined,
  };

  console.log('📋 Raw form data:', JSON.stringify(raw, null, 2));

  // Remove empty strings → undefined (so Zod optional fields behave)
  for (const [k, v] of Object.entries(raw)) if (v === "") raw[k] = undefined;
  
  console.log('🧹 Cleaned form data:', JSON.stringify(raw, null, 2));

  // 3. Zod validation → map to fieldErrors for inline display
  console.log('🔍 Starting Zod validation...');
  let data: z.infer<typeof EventCreateSchema>;

  try {
    data = EventCreateSchema.parse(raw);
    console.log('✅ Zod validation passed');
    console.log('📊 Validated data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('❌ Zod validation failed:', err);
    if (err instanceof z.ZodError) {
      const flat = err.flatten();
      console.log('📝 Validation errors:', JSON.stringify(flat.fieldErrors, null, 2));
      const fieldErrors = Object.fromEntries(
        Object.entries(flat.fieldErrors).map(([k, v]) => [
          k,
          (v as string[])?.[0] ?? "Invalid value",
        ])
      );
      return {
        pending: false,
        error: "VALIDATION_REQUIRED",
        fieldErrors,
        values: raw,
      };
    }
    console.log('❌ Unexpected validation error:', err);
    return { pending: false, error: "UNEXPECTED_SERVER", values: raw };
  }

  // Additional validation: ensure registration deadline is before event date
  if (data.registrationDeadline) {
    const registrationDeadline = new Date(data.registrationDeadline);
    const eventDate = new Date(data.date);

    if (registrationDeadline > eventDate) {
      return {
        pending: false,
        error: "VALIDATION_REQUIRED",
        fieldErrors: {
          registrationDeadline: "Registration deadline must be before the event date"
        },
        values: raw,
      };
    }
  }

  try {
    // 4. DB: verify facility exists
    console.log('🔌 Connecting to MongoDB...');
    await mongoConnect();
    console.log('✅ MongoDB connection successful');
    
    console.log('🏢 Verifying facility exists:', data.facility);
    const facilityDoc = await Facility.findById(data.facility);
    if (!facilityDoc) {
      console.log('❌ Facility not found:', data.facility);
      return {
        pending: false,
        error: "INVALID_FACILITY",
        fieldErrors: { facility: "Please select a valid facility." },
        values: raw,
      };
    }
    console.log('✅ Facility verified:', facilityDoc.name);

    // 5. Verify user exists or create if missing (fix for authentication-database mismatch)
    console.log('👤 Verifying user exists for createdBy field:', session.user.id);
    const User = (await import('@/lib/models/User')).default;
    let userDoc = await User.findById(session.user.id);
    
    if (!userDoc) {
      console.log('❌ User not found in database:', session.user.id);
      console.log('🔧 Attempting to create missing user from session data...');
      
      // Try to create the user from session data if we have enough information
      if (session.user.email && session.user.displayName) {
        try {
          userDoc = await User.create({
            _id: session.user.id, // Use the same ID from the session
            googleId: session.user.googleId,
            displayName: session.user.displayName,
            email: session.user.email,
            picture: session.user.picture,
            role: session.user.role,
          });
          console.log('✅ Successfully created missing user:', userDoc.displayName);
        } catch (createError) {
          console.error('❌ Failed to create missing user:', createError);
          return {
            pending: false,
            error: "USER_CREATION_FAILED", 
            values: raw,
          };
        }
      } else {
        console.log('❌ Cannot create user - insufficient session data');
        return {
          pending: false,
          error: "USER_SESSION_INCOMPLETE",
          values: raw,
        };
      }
    }
    console.log('✅ User verified/created:', userDoc.displayName, userDoc.email);

    // 6. Create event within transaction for atomicity
    console.log('🔄 Starting transaction for event creation...');
    const result = await withTransaction(async (mongoSession) => {
      console.log('💾 Creating event in database within transaction...');
      const eventData = {
        name: data.name,
        date: new Date(data.date),
        durationDays: data.durationDays,
        facility: new Types.ObjectId(data.facility),
        discipline: data.discipline,
        ageCategories: data.ageCategories,
        division: data.division,
        imageUrl: data.imageUrl,
        description: data.description,
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : undefined,
        maxParticipants: data.maxParticipants,
        entryFee: data.entryFee,
        contactEmail: data.contactEmail,
        createdBy: new Types.ObjectId(session.user.id),
      } as Partial<IEvent>;
      
      console.log('📝 Event data to be created:', JSON.stringify(eventData, null, 2));
      
      const newEvent = await Event.create([eventData], { session: mongoSession });
      console.log('✅ Event creation completed within transaction');
      console.log('📄 Created event:', JSON.stringify({
        id: newEvent[0]._id,
        name: newEvent[0].name,
        date: newEvent[0].date,
        facility: newEvent[0].facility
      }, null, 2));

      // 7. Verify event was actually saved within transaction
      console.log('🔍 Verifying event was saved to database...');
      const savedEvent = await Event.findById(newEvent[0]._id).session(mongoSession);
      if (!savedEvent) {
        console.log('❌ Event creation succeeded but verification failed - event not found in database');
        throw new Error('Event was created but could not be verified in database');
      }
      console.log('✅ Event verification successful - event exists in database');
      
      return newEvent[0];
    });

    console.log('✅ Transaction completed successfully');

    // 8. Mark the /events route stale (fresh data will be ready)
    console.log('🔄 Revalidating /events path...');
    revalidatePath("/events");

    // 9. Return success (no redirect) → client decides what to do
    console.log('🎉 Event creation process completed successfully');
    return {
      pending: false,
      success: true,
      id: result._id.toString(),
      name: result.name,
    };
  } catch (err) {
    console.error("❌ Event creation failed:", err);
    console.error("❌ Error type:", typeof err);
    console.error("❌ Error instance:", err instanceof Error);
    
    if (err instanceof Error) {
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);
    }
    
    if (err && typeof err === 'object') {
      console.error("❌ Error object keys:", Object.keys(err));
      console.error("❌ Full error object:", JSON.stringify(err, null, 2));
    }

    // Handle specific MongoDB errors
    if (err && typeof err === 'object' && 'code' in err) {
      if (err.code === 11000) {
        console.log("❌ Duplicate key error - event might already exist");
        return { pending: false, error: "DUPLICATE_EVENT", values: raw };
      }
    }

    // Handle Mongoose validation errors
    if (err && typeof err === 'object' && 'name' in err && err.name === 'ValidationError') {
      console.log("❌ Mongoose validation error");
      const validationErr = err as { errors?: Record<string, { message: string }> };
      const fieldErrors = Object.keys(validationErr.errors || {}).reduce((acc: Record<string, string>, key) => {
        acc[key] = validationErr.errors?.[key]?.message || 'Validation error';
        return acc;
      }, {});
      console.log("❌ Field validation errors:", fieldErrors);
      return {
        pending: false,
        error: "VALIDATION_REQUIRED",
        fieldErrors,
        values: raw,
      };
    }

    return { pending: false, error: "DB_ERROR", values: raw };
  }
}

export async function updateEventAction(
  _prevState: unknown,
  formData: FormData
): Promise<UpdateEventState> {
  // Auth Guard
  const session = await auth();
  if (!session) {
    return { pending: false, error: "UNAUTHORIZED" };
  }
  const eventId = formData.get("eventId") as string;
  if (!eventId) {
    return { pending: false, error: "EVENT_ID_REQUIRED" };
  }

  // 2. Extract and normalize raw data from FormData
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    date: formData.get("date"),
    durationDays: Number(formData.get("durationDays")),
    facility: formData.get("facility"),
    discipline: formData.get("discipline"),
    ageCategories: formData.getAll("ageCategories"),
    division: formData.get("division"),
    imageUrl: formData.get("imageUrl") || undefined,
    description: formData.get("description") || undefined,
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    maxParticipants: formData.get("maxParticipants")
      ? Number(formData.get("maxParticipants"))
      : undefined,
    entryFee: formData.get("entryFee")
      ? Number(formData.get("entryFee"))
      : undefined,
    contactEmail: formData.get("contactEmail") || undefined,
  };

  // Remove empty strings → undefined
  for (const [k, v] of Object.entries(raw)) {
    if (v === "") raw[k] = undefined;
  }

  // 3. Zod validation
  let data: z.infer<typeof EventCreateSchema>;

  try {
    data = EventCreateSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const flat = err.flatten();
      const fieldErrors = Object.fromEntries(
        Object.entries(flat.fieldErrors).map(([k, v]) => [
          k,
          (v as string[])?.[0] ?? "Invalid value",
        ])
      );
      return {
        pending: false,
        error: "VALIDATION_REQUIRED",
        fieldErrors,
        values: raw,
      };
    }
    return { pending: false, error: "UNEXPECTED_SERVER", values: raw };
  }

  // Additional validation: ensure registration deadline is before event date
  if (data.registrationDeadline) {
    const registrationDeadline = new Date(data.registrationDeadline);
    const eventDate = new Date(data.date);

    if (registrationDeadline > eventDate) {
      return {
        pending: false,
        error: "VALIDATION_REQUIRED",
        fieldErrors: {
          registrationDeadline: "Registration deadline must be before the event date"
        },
        values: raw,
      };
    }
  }

  try {
    // 4. DB operations
    await mongoConnect();

    // Check if event exists and user owns it
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return { pending: false, error: "EVENT_NOT_FOUND", values: raw };
    }

    // Permission check - use role-based permissions
    if (!canManageEvent(session.user.role, existingEvent.createdBy.toString(), session.user.id, 'update')) {
      return { pending: false, error: "NOT_AUTHORIZED", values: raw };
    }

    // Verify facility exists
    const facilityDoc = await Facility.findById(data.facility);
    if (!facilityDoc) {
      return {
        pending: false,
        error: "INVALID_FACILITY",
        fieldErrors: { facility: "Please select a valid facility." },
        values: raw,
      };
    }

    // 5. Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        name: data.name,
        date: new Date(data.date),
        durationDays: data.durationDays,
        facility: new Types.ObjectId(data.facility),
        discipline: data.discipline,
        ageCategories: data.ageCategories,
        division: data.division,
        imageUrl: data.imageUrl,
        description: data.description,
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : undefined,
        maxParticipants: data.maxParticipants,
        entryFee: data.entryFee,
        contactEmail: data.contactEmail,
      },
      { new: true }
    );

    if (!updatedEvent) {
      return { pending: false, error: "UPDATE_FAILED", values: raw };
    }

    // 6. Mark the /events route stale
    revalidatePath("/events");

    // 7. Return success
    return {
      pending: false,
      success: true,
      id: updatedEvent._id.toString(),
      name: updatedEvent.name,
    };
  } catch (err) {
    console.error("Event update failed:", err);
    return { pending: false, error: "DB_ERROR", values: raw };
  }
}

export async function deleteEventAction(
  _prevState: unknown,
  formData: FormData
): Promise<DeleteEventState> {
  // 1. Auth guard (no redirect here—return an error for the form)
  const session = await auth();
  if (!session) {
    return { pending: false, error: "UNAUTHORIZED" };
  }

  const eventId = formData.get("eventId") as string;

  try {
    // Connect to database
    await mongoConnect();

    // After finding the event, check if user owns it
    const event = await Event.findById(eventId);
    if (!event) {
      return { pending: false, error: "EVENT_NOT_FOUND" };
    }

    // Permission check - use role-based permissions
    if (!canManageEvent(session.user.role, event.createdBy.toString(), session.user.id, 'delete')) {
      return { pending: false, error: "NOT_Authorized" };
    }

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    // Mark the /events route stale
    revalidatePath("/events");

    // Return success
    return { pending: false, success: true, id: eventId, name: event.name };
  } catch (err) {
    console.error("Event deletion failed:", err);
    return { pending: false, error: "DB_ERROR" };
  }
}

// Register for event action
export async function registerForEventAction(eventId: string) {
  try {

    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // Debug session structure
    console.log('Session object:', JSON.stringify(session, null, 2));
    console.log('Session user ID:', session.user?.id);
    
    if (!session.user?.id) {
      console.error('Session user ID is missing!', session.user);
      return { success: false, error: 'Session error: user ID not found' };
    }

    // 2. Permission check - only athletes and officials can register
    // Admins cannot register per recent permission update
    if (!hasPermission(session.user.role, 'canRegisterForEvents')) {
      return {
        success: false,
        error: 'You do not have permission to register for events'
      };
    }

    // 3. Connect to database
    await mongoConnect();

    // 4. Validate event ID
    if (!Types.ObjectId.isValid(eventId)) {
      return { success: false, error: 'Invalid event ID' };
    }

    // 5. Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // 6. Check if registration is open
    if (!event.isRegistrationOpen()) {
      return { success: false, error: 'Registration is closed for this event' };
    }

    // 7. Verify user exists in database or create if missing (same fix as event creation)
    console.log('👤 Verifying user exists for registration:', session.user.id);
    const User = (await import('@/lib/models/User')).default;
    let userDoc = await User.findById(session.user.id);
    
    if (!userDoc) {
      console.log('❌ User not found in database during registration:', session.user.id);
      console.log('🔧 Attempting to create missing user from session data...');
      
      if (session.user.email && session.user.displayName) {
        try {
          userDoc = await User.create({
            _id: session.user.id,
            googleId: session.user.googleId,
            displayName: session.user.displayName,
            email: session.user.email,
            picture: session.user.picture,
            role: session.user.role,
          });
          console.log('✅ Successfully created missing user for registration:', userDoc.displayName);
        } catch (createError) {
          console.error('❌ Failed to create missing user for registration:', createError);
          return { success: false, error: 'User account setup failed' };
        }
      } else {
        console.log('❌ Cannot create user - insufficient session data for registration');
        return { success: false, error: 'Incomplete user session data' };
      }
    }
    console.log('✅ User verified/created for registration:', userDoc.displayName, userDoc.email);

    // 8. Execute registration within transaction for atomicity
    console.log('🔄 Starting transaction for registration...');
    const result = await withTransaction(async (mongoSession) => {
      console.log('📋 Inside transaction, checking existing registration...');
      
      // Re-check if user is already registered (within transaction)
      const existingRegistration = await Registration.findOne({
        userId: new Types.ObjectId(session.user.id),
        eventId: new Types.ObjectId(eventId),
        status: { $in: ['registered', 'waitlisted'] }
      }).session(mongoSession);

      console.log('🔍 Existing registration check:', existingRegistration ? 'FOUND' : 'NONE');

      if (existingRegistration) {
        throw new Error(`You are already ${existingRegistration.status} for this event`);
      }

      // Get current registration counts within transaction (prevents race conditions)
      console.log('📊 Getting current registration counts...');
      const currentRegisteredCount = await Registration.countDocuments({
        eventId: new Types.ObjectId(eventId),
        status: 'registered'
      }).session(mongoSession);

      const currentWaitlistCount = await Registration.countDocuments({
        eventId: new Types.ObjectId(eventId),
        status: 'waitlisted'
      }).session(mongoSession);

      console.log(`📈 Current counts - Registered: ${currentRegisteredCount}, Waitlisted: ${currentWaitlistCount}`);
      console.log(`🎯 Event capacity: ${event.maxCapacity}`);

      // Determine registration status based on current capacity
      const registrationStatus = (event.maxCapacity === 0 || currentRegisteredCount < event.maxCapacity) 
        ? 'registered' 
        : 'waitlisted';

      console.log(`✅ Registration status determined: ${registrationStatus}`);

      // Create registration
      console.log('💾 Creating registration document...');
      const registrationData = {
        userId: new Types.ObjectId(session.user.id),
        eventId: new Types.ObjectId(eventId),
        status: registrationStatus
      };
      
      console.log('📝 Registration data:', JSON.stringify(registrationData, null, 2));
      
      const registration = await Registration.create([registrationData], { session: mongoSession });
      
      console.log('✅ Registration created:', registration[0] ? 'SUCCESS' : 'FAILED');
      console.log('📄 Registration document:', JSON.stringify(registration[0], null, 2));

      // Update event counts atomically
      const newRegisteredCount = currentRegisteredCount + (registrationStatus === 'registered' ? 1 : 0);
      const newWaitlistCount = currentWaitlistCount + (registrationStatus === 'waitlisted' ? 1 : 0);

      console.log(`🔢 Updating event counts - Registered: ${newRegisteredCount}, Waitlisted: ${newWaitlistCount}`);

      const eventUpdate = await Event.findByIdAndUpdate(
        eventId,
        {
          registrationCount: newRegisteredCount,
          waitlistCount: newWaitlistCount
        },
        { session: mongoSession, new: true }
      );

      console.log('📊 Event update result:', eventUpdate ? 'SUCCESS' : 'FAILED');

      const transactionResult = {
        registrationStatus,
        registration: registration[0]
      };
      
      console.log('🎉 Transaction completing successfully with result:', JSON.stringify(transactionResult, null, 2));
      return transactionResult;
    });
    
    console.log('✅ Transaction completed successfully');

    // 8. Revalidate the events page
    revalidatePath('/events');

    return {
      success: true,
      message: result.registrationStatus === 'registered'
        ? 'Successfully registered for event!'
        : 'Event is full, you have been added to the waitlist',
      status: result.registrationStatus
    };

  } catch (error) {
    console.error('❌ Registration error caught:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error instance:', error instanceof Error);
    
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    
    if (error && typeof error === 'object') {
      console.error('❌ Error object keys:', Object.keys(error));
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    }

    // Handle specific transaction errors
    if (error instanceof Error) {
      // Handle business logic errors thrown from transaction
      if (error.message.includes('already registered') || error.message.includes('already waitlisted')) {
        console.log('🔁 Returning already registered error');
        return { success: false, error: error.message };
      }
    }

    // Handle duplicate registration error (MongoDB constraint violation)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      console.log('🔁 Returning duplicate key error');
      return { success: false, error: 'You are already registered for this event' };
    }

    console.log('🔁 Returning generic error');
    return { success: false, error: 'Failed to register for event' };
  }
}

// Unregister from event action
export async function unregisterFromEventAction(eventId: string) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // 2. Connect to database
    await mongoConnect();

    // 3. Validate event ID
    if (!Types.ObjectId.isValid(eventId)) {
      return { success: false, error: 'Invalid event ID' };
    }

    // 4. Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // 5. Check if unregistration is allowed (before deadline)
    if (event.registrationDeadline && isAfterDeadline(event.registrationDeadline)) {
      return {
        success: false,
        error: 'Cannot unregister after registration deadline'
      };
    }

    // 6. Execute unregistration within transaction for atomicity
    const result = await withTransaction(async (mongoSession) => {
      // Find and capture original registration status
      const originalRegistration = await Registration.findOne({
        userId: new Types.ObjectId(session.user.id),
        eventId: new Types.ObjectId(eventId),
        status: { $in: ['registered', 'waitlisted'] }
      }).session(mongoSession);

      if (!originalRegistration) {
        throw new Error('You are not registered for this event');
      }

      const wasRegistered = originalRegistration.status === 'registered';

      // Update registration to cancelled
      await Registration.findByIdAndUpdate(
        originalRegistration._id,
        { status: 'cancelled' },
        { session: mongoSession }
      );

      let promotedUser = null;

      // If user was registered (not waitlisted), promote someone from waitlist
      if (wasRegistered) {
        promotedUser = await Registration.findOneAndUpdate(
          {
            eventId: new Types.ObjectId(eventId),
            status: 'waitlisted'
          },
          { status: 'registered' },
          { sort: { registeredAt: 1 }, new: true, session: mongoSession } // First in, first promoted
        );
      }

      // Get current counts for atomic update
      const newRegisteredCount = await Registration.countDocuments({
        eventId: new Types.ObjectId(eventId),
        status: 'registered'
      }).session(mongoSession);

      const newWaitlistCount = await Registration.countDocuments({
        eventId: new Types.ObjectId(eventId),
        status: 'waitlisted'
      }).session(mongoSession);

      // Update event counts atomically
      await Event.findByIdAndUpdate(
        eventId,
        {
          registrationCount: newRegisteredCount,
          waitlistCount: newWaitlistCount
        },
        { session: mongoSession }
      );

      return {
        wasRegistered,
        promotedUser
      };
    });

    // Log successful waitlist promotion
    if (result.promotedUser) {
      console.log(`Promoted user ${result.promotedUser.userId} from waitlist to registered`);
    }

    // 7. Revalidate the events page
    revalidatePath('/events');

    return {
      success: true,
      message: 'Successfully unregistered from event'
    };

  } catch (error) {
    console.error('Unregistration error:', error);

    // Handle specific transaction errors
    if (error instanceof Error) {
      if (error.message.includes('not registered')) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to unregister from event' };
  }
}

// Get user's registration status for an event
export async function getUserEventRegistrationStatus(eventId: string) {
  try {
    const session = await auth();
    if (!session) return null;

    await mongoConnect();

    if (!Types.ObjectId.isValid(eventId)) return null;

    const registration = await Registration.findOne({
      userId: new Types.ObjectId(session.user.id),
      eventId: new Types.ObjectId(eventId),
      status: { $in: ['registered', 'waitlisted'] }
    });

    return registration ? registration.status : null;
  } catch (error) {
    console.error('Error getting registration status:', error);
    return null;
  }
}

// Get event registrations (for admins)
export async function getEventRegistrations(eventId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // Only admins/owners can view registrations
    if (!hasPermission(session.user.role, 'canManageEvents')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    await mongoConnect();

    if (!Types.ObjectId.isValid(eventId)) {
      return { success: false, error: 'Invalid event ID' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registrations = await (Registration as any).getEventRegistrations(
      new Types.ObjectId(eventId)
    );

    return { success: true, registrations };
  } catch (error) {
    console.error('Error getting event registrations:', error);
    return { success: false, error: 'Failed to get registrations' };
  }
}