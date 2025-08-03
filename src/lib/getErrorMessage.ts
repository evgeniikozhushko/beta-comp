export function getErrorMessage(error: string | Error): string {
    const code = typeof error === "string" ? error : error.message;
    switch (code) {
      case "DUPLICATE_EMAIL":
        return "An account with this email already exists. Try signing in instead.";
      case "PASSWORD_TOO_SHORT":
        return "Password must be at least 8 characters long.";
      case "PASSWORDS_MISMATCH":
        return "Passwords do not match. Please try again.";
      case "MISSING_FIELDS":
        return "Please fill in all required fields.";
      case "INVALID_CREDENTIALS":
        return "Invalid email or password. Please try again.";
      case "DATABASE_ERROR":
        return "Unable to connect to our servers. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  }