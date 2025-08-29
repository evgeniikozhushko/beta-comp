  // models/User.ts
  import { Schema, Document, model, models } from 'mongoose';

  // TypeScript interface for the User document
  export interface IUser extends Document {
    googleId?: string;
    displayName: string;
    email?: string;
    picture?: string;
    password?: string;
    createdAt: Date;
    updatedAt: Date;
    eventsAttanding?: any[]; // list of events signed up for
  }

  // Define the Mongoose schema with types and options
  const UserSchema = new Schema<IUser>(
    {
      googleId: {
        type: String,
        sparse: true, // Allow multiple null values
        index: true,
      },
      displayName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        lowercase: true,
        unique: true,
      },
      picture: {
        type: String,
      },
      password: {
        type: String,
        required: false, // Not required for Google OAuth users
      },
      eventsAttanding: {
        type: [Schema.Types.ObjectId]
      },
    },
    {
      timestamps: true, // adds createdAt and updatedAt automatically
    }
  );

  // Index on googleId is already created by sparse: true above

  // Export the model (re-use if already created to prevent recompile errors)
  export default models.User || model<IUser>('User', UserSchema);
