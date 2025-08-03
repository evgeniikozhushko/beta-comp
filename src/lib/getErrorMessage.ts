export function getErrorMessage(error: string | Error): string {
    const code = typeof error === "string" ? error : error.message;
  
    switch (code) {
      // Validation & input
      case "MISSING_FIELDS":
      case "VALIDATION_REQUIRED":
        return "Please fill in all required fields.";
      case "PASSWORD_TOO_SHORT":
        return "Password must be at least 8 characters long.";
      case "PASSWORDS_MISMATCH":
        return "Passwords do not match. Please try again.";
      case "INVALID_EMAIL_FORMAT":
        return "That doesn’t look like a valid email address.";
  
      // Sign-up specific
      case "DUPLICATE_EMAIL":
        return "An account with this email already exists. Try signing in instead.";
      case "HASHING_ERROR":
        return "We had trouble securing your password. Please try again.";
  
      // Sign-in specific
      case "INVALID_CREDENTIALS":
        return "Invalid email or password. Please try again.";
  
      // System / server
      case "DB_ERROR":
      case "DATABASE_ERROR":
        return "Our servers are taking a break. Please try again in a moment.";
      case "UNEXPECTED_SERVER":
        return "Something unexpected happened. Please refresh and try again.";
  
      default:
        // Fallback for any un-coded error
        return "Something went wrong. Please try again.";
    }
  }