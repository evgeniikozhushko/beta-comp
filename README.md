# Beta-Comp

A comprehensive competition management platform built with Next.js 15, featuring advanced user authentication, role-based access control, event management, and a modern dashboard interface for organizing athletic competitions.

## 🚀 Features

### Authentication & Authorization System
- **Google OAuth Integration**: One-click sign-in with Google accounts
- **Email/Password Authentication**: Traditional account creation and login
- **JWT Token Management**: Secure session handling with HTTP-only cookies
- **Role-Based Access Control**: Four-tier permission system (Owner, Admin, Athlete, Official)
- **Protected Routes**: Automatic redirection based on authentication and permissions
- **Session Management**: Persistent login state across browser sessions

### User Management & Roles
- **Multi-Role System**: Owner, Admin, Athlete, and Official roles with granular permissions
- **Admin API Endpoints**: RESTful APIs for user management and role assignment
- **User Registration**: Create accounts with email/password or Google OAuth
- **Password Security**: BCrypt hashing for secure password storage
- **User Profiles**: Display name, email, and role management
- **MongoDB Integration**: Secure user data storage with Mongoose ODM

### Event Management System
- **Event Creation**: Full event creation with facility selection and detailed configuration
- **Event Listing**: Comprehensive event display with registration status
- **Event Registration**: User registration system with capacity management
- **Facility Management**: Integrated facility database with location data
- **Event Updates**: Edit and delete events with proper permission checks
- **Registration Tracking**: Real-time registration counts and status management

### Dashboard & Analytics
- **Personalized Dashboard**: Role-based dashboard with relevant statistics
- **Event Overview**: Quick access to events with registration status
- **User Statistics**: Registration counts, upcoming events, and activity tracking
- **Admin Controls**: User management interface for administrators
- **Quick Actions**: Streamlined access to common tasks

### User Interface & Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Components**: Radix UI components with custom styling
- **Sidebar Navigation**: Intuitive navigation with role-based menu items
- **Loading States**: Comprehensive loading and error state management
- **Type Safety**: Full TypeScript integration throughout the application
- **Accessible Forms**: Proper form validation and error messaging

### Technical Features
- **Server-Side Rendering**: Next.js App Router with React Server Components
- **API Routes**: RESTful endpoints with proper authentication and authorization
- **Database Connection**: MongoDB with connection pooling and error handling
- **Error Boundaries**: Centralized error handling system
- **Development Tools**: Debug routes, database scripts, and testing utilities
- **Data Serialization**: Proper MongoDB document serialization for API responses

## 🛠 Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router and React Server Components
- **React 19** - Latest React features and hooks
- **TypeScript 5.8.3** - Type safety and enhanced development experience
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives (Accordion, Avatar, Dialog, etc.)
- **Lucide React 0.525.0** - Modern icon library
- **Next Themes 0.4.6** - Theme management and dark mode support
- **Sonner 2.0.7** - Toast notifications

### Backend & Database
- **Node.js** - Runtime environment
- **MongoDB 8.16.5** - NoSQL database with Mongoose ODM
- **Mongoose** - MongoDB object modeling and schema validation
- **JWT (jsonwebtoken 9.0.2)** - JSON Web Tokens for authentication
- **BCrypt 6.0.0** - Password hashing and verification
- **Passport.js** - Authentication middleware with Google OAuth strategy

### Development & Build Tools
- **ESLint 9** - Code linting and formatting
- **TypeScript** - Static type checking
- **TSX 4.20.3** - TypeScript execution for scripts
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
src/
├── app/                           # Next.js App Router pages
│   ├── (auth)/                   # Authentication pages group
│   │   ├── sign-in/              # Login page with error handling
│   │   └── sign-up/              # Registration page with error handling
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin management endpoints
│   │   │   ├── users/            # User management API
│   │   │   ├── reconcile/        # Data reconciliation tools
│   │   │   └── seed-facilities/  # Facility seeding
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── google/           # Google OAuth flow
│   │   │   └── signout/          # Sign out endpoint
│   │   ├── debug/                # Development debugging routes
│   │   └── events/               # Event management API
│   ├── dashboard/                # Main dashboard interface
│   │   ├── athletes/             # Athlete management
│   │   │   └── manage/           # User role management
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home with statistics
│   │   └── CreateEventCard.tsx   # Event creation component
│   ├── about/                    # About page
│   ├── events/                   # Event listing and management
│   ├── login/                    # Legacy login page
│   ├── page.tsx                  # Landing page (public)
│   └── layout.tsx                # Root layout
├── components/                   # Reusable UI components
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── app-sidebar.tsx       # Main navigation sidebar
│   │   ├── calendars.tsx         # Calendar components
│   │   ├── nav-main.tsx          # Navigation menu
│   │   └── nav-user.tsx          # User navigation
│   ├── ui/                       # Base UI components (Radix UI)
│   │   ├── accordion.tsx         # Event accordion
│   │   ├── avatar.tsx            # User avatars
│   │   ├── button.tsx            # Button components
│   │   ├── card.tsx              # Card layouts
│   │   ├── input.tsx             # Form inputs
│   │   ├── select.tsx            # Select dropdowns
│   │   ├── sheet.tsx             # Modal sheets
│   │   ├── sidebar.tsx           # Sidebar component
│   │   └── table.tsx             # Data tables
│   ├── EventAccordion.tsx        # Event display component
│   ├── EventForm.tsx             # Event creation/editing form
│   ├── EventRegistrationButton.tsx # Registration controls
│   ├── CreateEventSheet.tsx      # Event creation modal
│   └── UpdateEventSheet.tsx      # Event editing modal
├── lib/                          # Utility functions and configurations
│   ├── models/                   # Database models
│   │   ├── Event.ts              # Event schema
│   │   ├── Facility.ts           # Facility schema
│   │   ├── Registration.ts       # Registration schema
│   │   └── User.ts               # User schema
│   ├── types/                    # TypeScript type definitions
│   │   ├── admin.ts              # Admin API types
│   │   └── permissions.ts        # Role and permission types
│   ├── utils/                    # Utility functions
│   │   └── serialize.ts          # MongoDB serialization
│   ├── auth.ts                   # Authentication logic
│   ├── mongodb.ts                # Database connection
│   ├── reconciliation.ts         # Data reconciliation tools
│   └── utils.ts                  # General utilities
├── data/                         # Static data files
│   ├── facilities.ca.generated.json # Generated facility data
│   └── facilities.ca.ts          # Facility data processing
└── hooks/                        # Custom React hooks
    └── use-mobile.ts             # Mobile detection hook
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database (local or cloud)
- Google OAuth credentials (for Google sign-in)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/evgeniikozhushko/beta-comp.git
   cd beta-comp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_jwt_secret_key
   
   # Google OAuth (optional, for Google sign-in)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Database Management
- `npm run gen:facilities` - Generate facilities from CEC data
- `npm run seed:facilities` - Seed facilities database
- `npm run seed:facilities:manual` - Manual facility seeding
- `npm run test:db` - Test database connection

### User Management
- `npm run migrate:roles` - Migrate existing users to role system
- `npm run assign:role` - Assign roles to users via command line
- `npm run reconcile:counts` - Reconcile registration counts

### Testing
- `npm run test:event-action` - Test event creation actions

## 🔐 Authentication & Role Management

### Authentication Flow
1. **New Users**: Visit `/sign-up` to create an account or use Google OAuth
2. **Existing Users**: Visit `/sign-in` to log in with credentials or Google
3. **Protected Access**: All main features require authentication
4. **Session Management**: Users stay logged in across browser sessions
5. **Secure Logout**: Sign out clears all session data

### Role-Based Access Control

The platform implements a comprehensive four-tier role system:

#### Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Owner** 👑 | Full system access | All permissions, can assign owner role |
| **Admin** 🛡️ | Administrative access | Manage users, events, facilities (cannot register for events) |
| **Athlete** 🏃 | Competition participant | View events, register for competitions |
| **Official** 🏁 | Event official | View events only, no registration |

#### Permission Matrix

| Feature | Owner | Admin | Athlete | Official |
|---------|-------|-------|---------|----------|
| View Events | ✅ | ✅ | ✅ | ✅ |
| Create Events | ✅ | ✅ | ❌ | ❌ |
| Edit Own Events | ✅ | ✅ | ❌ | ❌ |
| Delete Own Events | ✅ | ✅ | ❌ | ❌ |
| Edit Any Event | ✅ | ✅ | ❌ | ❌ |
| Delete Any Event | ✅ | ✅ | ❌ | ❌ |
| Register for Events | ✅ | ❌ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Manage Facilities | ✅ | ✅ | ❌ | ❌ |

### Role Assignment Methods

#### 1. Command Line Script (Recommended)
```bash
# List all users and their roles
npm run assign:role -- --list

# Assign roles to users
npm run assign:role -- user@example.com admin
npm run assign:role -- athlete@example.com athlete
npm run assign:role -- official@example.com official
```

#### 2. Admin API Endpoints
```bash
# List all users (Admin/Owner only)
curl -H "Authorization: Bearer <jwt-token>" \
  "http://localhost:3000/api/admin/users"

# Update user role
curl -X PATCH \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}' \
  "http://localhost:3000/api/admin/users/<user-id>/role"
```

#### 3. Initial Migration
```bash
# One-time migration for existing users
npm run migrate:roles
```

## 🎯 Core Pages & Features

### Landing Page (`/`)
- **Access**: Public (unauthenticated users)
- **Features**: Hero section, feature overview, call-to-action buttons
- **Redirect**: Authenticated users automatically redirected to dashboard

### Dashboard (`/dashboard`)
- **Access**: Protected (requires authentication)
- **Features**: 
  - Personalized welcome with user statistics
  - Event overview with registration status
  - Quick action cards based on user role
  - Event accordion with registration controls
  - Admin controls for user management (Owner/Admin only)

### Authentication Pages
- **Sign In** (`/sign-in`): Login with email/password or Google OAuth
- **Sign Up** (`/sign-up`): Create new account with email/password
- **Error Handling**: Comprehensive error states and user feedback

### Event Management (`/events`)
- **Access**: Public
- **Features**: 
  - View all events with detailed information
  - Registration status and capacity information
  - Event creation and editing (Owner/Admin only)
  - Registration management for athletes

### User Management (`/dashboard/athletes/manage`)
- **Access**: Owner/Admin only
- **Features**: 
  - User list with role management
  - Search and filter capabilities
  - Role assignment interface
  - User statistics and activity tracking

### About Page (`/about`)
- **Access**: Public
- **Content**: Information about the platform and its features

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `POST /api/auth/signout` - Sign out user and clear session

### Events
- `GET /api/events` - Retrieve all events with pagination support
- `POST /api/events` - Create new event (Owner/Admin only)
- `GET /api/events/[id]` - Get specific event details
- `PATCH /api/events/[id]` - Update event (Owner/Admin only)
- `DELETE /api/events/[id]` - Delete event (Owner/Admin only)

### Admin Management (Owner/Admin only)
- `GET /api/admin/users` - List all users with pagination and filtering
- `GET /api/admin/users/[id]/role` - Get specific user details
- `PATCH /api/admin/users/[id]/role` - Update user role
- `POST /api/admin/reconcile` - Run registration count reconciliation
- `POST /api/admin/seed-facilities` - Seed facilities database

### Development & Debug
- `POST /api/debug/create-test-user` - Create test users for development
- `GET /api/debug/users` - List all users (development only)
- `GET /api/debug/events` - List all events (development only)
- `GET /api/debug/facilities` - List all facilities (development only)
- `GET /api/debug/registrations` - List all registrations (development only)
- `GET /api/debug/session` - Get current session info (development only)

## 🚀 Deployment

The application is configured for deployment on Render.com with automatic builds from GitHub.

### Build Requirements
- Node.js 22.16.0 (specified in Render)
- All dependencies properly installed
- Environment variables configured
- MongoDB connection established

### Build Command
```bash
npm install; npm run build
```

## 🛡 Security Features

- **Password Hashing**: BCrypt for secure password storage
- **JWT Tokens**: Secure session management
- **HTTP-Only Cookies**: Prevent XSS attacks on session tokens
- **Input Validation**: Server-side validation for all user inputs
- **Error Handling**: Secure error messages without exposing system details
- **Type Safety**: TypeScript prevents runtime type errors

## 🎯 Current Features & Capabilities

### ✅ Implemented Features

#### Event Management
- **Event Creation**: Full event creation with facility selection, date/time, capacity limits
- **Event Editing**: Update event details, capacity, and registration deadlines
- **Event Deletion**: Remove events with proper permission checks
- **Facility Integration**: Comprehensive facility database with location data
- **Registration System**: User registration with capacity management and waitlisting

#### User Management
- **Role-Based Access Control**: Four-tier permission system (Owner, Admin, Athlete, Official)
- **User Registration**: Email/password and Google OAuth authentication
- **Admin Interface**: User management with role assignment capabilities
- **Profile Management**: User profiles with display names and avatars

#### Dashboard & Analytics
- **Personalized Dashboard**: Role-based dashboard with relevant statistics
- **Event Statistics**: Total events, user registrations, monthly events
- **Quick Actions**: Streamlined access to common tasks based on user role
- **Registration Tracking**: Real-time registration counts and status

#### Data Management
- **Facility Database**: Comprehensive facility data with Canadian locations
- **Registration Reconciliation**: Tools to maintain data integrity
- **Database Scripts**: Automated seeding and migration tools

### 🔄 Future Enhancements

Based on the current structure, planned features include:
- **Advanced Athlete Profiles**: Comprehensive athlete database with performance history
- **Live Scoring System**: Real-time competition scoring and results
- **Custom Competition Types**: Configurable competition rules and formats
- **Advanced Reporting**: Competition results, analytics, and performance metrics
- **Mobile App**: Native mobile application for athletes and officials
- **Payment Integration**: Registration fees and payment processing
- **Notification System**: Email and SMS notifications for events and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Troubleshooting

### Common Issues

1. **Build Fails with TypeScript Errors**
   - Ensure all type definitions are installed (`@types/*` packages)
   - Check for any `any` types and replace with proper interfaces
   - Run `npm run lint` to identify and fix issues

2. **Database Connection Issues**
   - Verify MONGODB_URI in environment variables
   - Check MongoDB server accessibility
   - Ensure database user has proper permissions
   - Test connection with `npm run test:db`

3. **Authentication Not Working**
   - Verify JWT_SECRET is set and consistent
   - Check Google OAuth credentials if using Google sign-in
   - Clear browser cookies and try again
   - Check session with `/api/debug/session` endpoint

4. **Role Management Issues**
   - Run `npm run migrate:roles` for existing users
   - Use `npm run assign:role -- --list` to check current roles
   - Ensure users sign out and back in after role changes

5. **Event Registration Problems**
   - Check event capacity limits
   - Verify registration deadlines
   - Run `npm run reconcile:counts` to fix count discrepancies

6. **Development Server Issues**
   - Clear `.next` cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
   - Check for port conflicts (default: 3000)
   - Use debug endpoints to verify data integrity

## 📞 Support

For support and questions, please create an issue in the GitHub repository.