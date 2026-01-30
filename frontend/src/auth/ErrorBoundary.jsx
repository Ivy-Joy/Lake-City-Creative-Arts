// src/auth/ErrorBoundary.jsx
import React from "react";

// ErrorBoundary is a special React component that "catches" JavaScript errors
// in its child components, preventing the entire app from crashing.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // state keeps track of whether an error has occurred
    this.state = { hasError: false, error: null };
  }
  // This lifecycle method is called when a descendant throws an error.
  // It updates state so the next render will show the fallback UI.
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  // This lifecycle method is called after an error has been thrown, it gives more details about the error (error + stack trace).
  // Useful for logging errors to monitoring tools like Sentry or logging in console.
  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    // If an error was caught, show fallback UI instead of crashing the app.
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    // If no error, render children components normally
    return this.props.children;
  }
}
