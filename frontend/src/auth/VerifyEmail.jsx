// src/auth/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState(token ? "loading" : "awaiting"); 
  // awaiting = waiting for user to verify via email
  const [message, setMessage] = useState(
    token
      ? "Verifying your email..."
      : "Please check your inbox and click the link we sent to verify your account."
  );

  useEffect(() => {
    if (!token) return; // skip if no token

    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/verify/${token}`
        );
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed ❌");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("Unable to connect to server ❌");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h2>Email Verification</h2>
        <p className={status === "error" ? "error-text" : "success-text"}>
          {message}
        </p>

        {/* Awaiting verification after signup */}
        {status === "awaiting" && (
          <div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/auth/resend-verification`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: localStorage.getItem("pendingEmail"), // saved at signup
                      }),
                    }
                  );
                  const data = await res.json();
                  setMessage(data.message || "Check your email again!");
                } catch (err) {
                  console.error("Resend error:", err);
                  setMessage("Error resending verification ❌");
                }
              }}
            >
              Resend Verification Email
            </button>

            <button onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        )}

        {/* Show resend also if token verification fails */}
        {status === "error" && (
          <div className="verify-actions">
            <button className="btn-secondary"
              onClick={async () => {
                try {
                  const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/auth/resend-verification`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: localStorage.getItem("pendingEmail"),
                      }),
                    }
                  );
                  const data = await res.json();
                  setMessage(data.message || "Check your email again!");
                } catch (err) {
                  console.error("Resend error:", err);
                  setMessage("Error resending verification ❌");
                }
              }}
            >
              Resend Verification Email
            </button>
            <button className="btn-primary" onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}
