# Beta-Comp

A modern competition management platform built with Next.js 15, featuring user authentication, event management, and a comprehensive web interface for organizing athletic competitions.

## 🚀 Features

### Authentication System
- **Google OAuth Integration**: One-click sign-in with Google accounts
- **Email/Password Authentication**: Traditional account creation and login
- **JWT Token Management**: Secure session handling with HTTP-only cookies
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Session Management**: Persistent login state across browser sessions

### User Management
- **User Registration**: Create accounts with email/password or Google OAuth
- **Password Security**: BCrypt hashing for secure password storage
- **User Profiles**: Display name and email management
- **MongoDB Integration**: Secure user data storage with Mongoose ODM

### Event Management
- **Event Listing**: View all available events with details
- **Event Display**: Title, date, location, and description for each event
- **Dynamic Loading**: Client-side event fetching with loading states
- **Error Handling**: Graceful error display for failed requests

### User Interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Support**: Automatic theme switching capabilities
- **Modern Components**: Radix UI components with custom styling
- **Type Safety**: Full TypeScript integration throughout the app
- **Accessible Forms**: Proper form validation and error messaging

### Technical Features
- **Server-Side Rendering**: Next.js App Router with RSC support
- **API Routes**: RESTful endpoints for data management
- **Database Connection**: MongoDB with connection pooling
- **Error Boundaries**: Centralized error handling system
- **Development Tools**: Debug routes for testing and development

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features and hooks
- **TypeScript** - Type safety and enhanced development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - Runtime environment
- **MongoDB** - NoSQL database for user and event data
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **BCrypt** - Password hashing and verification

### Development Tools
- **ESLint** - Code linting and formatting
- **Turbopack** - Fast development build tool
- **TypeScript** - Static type checking

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages group
│   │   ├── sign-in/       # Login page
│   │   └── sign-up/       # Registration page
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── events/        # Event management API
│   │   └── debug/         # Development debugging routes
│   ├── about/             # About page
│   ├── events/            # Event listing page
│   └── page.tsx           # Home page (protected)
├── components/            # Reusable UI components
│   └── ui/                # Base UI components
├── lib/                   # Utility functions and configurations
│   ├── auth.ts            # Authentication logic
│   ├── mongodb.ts         # Database connection
│   ├── models/            # Database models
│   └── utils.ts           # General utilities
└── styles/                # Global styles and Tailwind config
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

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🔐 Authentication Flow

1. **New Users**: Visit `/sign-up` to create an account or use Google OAuth
2. **Existing Users**: Visit `/sign-in` to log in with credentials or Google
3. **Protected Access**: All main features require authentication
4. **Session Management**: Users stay logged in across browser sessions
5. **Secure Logout**: Sign out clears all session data

## 🎯 Core Pages

### Home Page (`/`)
- **Access**: Protected (requires authentication)
- **Features**: Welcome message, navigation to features, sign-out functionality
- **Display**: User profile information, available features overview

### Authentication Pages
- **Sign In** (`/sign-in`): Login with email/password or Google OAuth
- **Sign Up** (`/sign-up`): Create new account with email/password

### Event Management (`/events`)
- **Access**: Public (currently)
- **Features**: View all events, event details, navigation back to home
- **Data**: Fetches events from `/api/events` endpoint

### About Page (`/about`)
- **Access**: Public
- **Content**: Information about the platform and its features

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Handle Google OAuth callback

### Events
- `GET /api/events` - Retrieve all events with pagination support

### Development (Debug Routes)
- `POST /api/debug/create-test-user` - Create test users for development
- `GET /api/debug/users` - List all users (development only)

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

## 🔄 Future Enhancements

Based on the current structure, planned features include:
- **Athlete Database**: Comprehensive athlete profile management
- **Live Scoring**: Real-time competition scoring system
- **Custom Features**: Configurable competition types and rules
- **Advanced Event Management**: Event creation, editing, and scheduling
- **Role-based Access**: Admin, judge, and athlete user roles
- **Reporting**: Competition results and analytics

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

2. **Database Connection Issues**
   - Verify MONGODB_URI in environment variables
   - Check MongoDB server accessibility
   - Ensure database user has proper permissions

3. **Authentication Not Working**
   - Verify JWT_SECRET is set and consistent
   - Check Google OAuth credentials if using Google sign-in
   - Clear browser cookies and try again

4. **Development Server Issues**
   - Clear `.next` cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
   - Check for port conflicts (default: 3000)

## 📞 Support

For support and questions, please create an issue in the GitHub repository.