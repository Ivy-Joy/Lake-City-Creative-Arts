import { useState } from "react";
import MainLayout from "../layouts/MainLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setMessage(data.message);
      else setError(data.message || "Something went wrong");
    } catch {
      setError("Network error. Try again.");
    }
  };

  return (
    <MainLayout>
      <section id="forgot-password" className="section-p1">
        <div className="fp-container">
          <h2>Forgot Your Password?</h2>
          <p>No worries! Enter your email and we'll send you a link to reset your password.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="normal">Send Reset Link</button>
          </form>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </section>
    </MainLayout>
  );
}
