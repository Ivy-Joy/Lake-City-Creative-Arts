// src/auth/RequireAuth.jsx
//it protects pages that should only be accessible when a user is logged in.
//RequireAuth checks if a user is logged in (by checking if there’s a user in context).
//RequireAuth is used in App.jsx to wrap protected routes.

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "./useAuthContext.jsx";

export default function RequireAuth({ children }) {
  // since you already have useAuth.js (and ideally AuthProvider),
  // you can clean this up so it doesn’t read localStorage directly.
  //const user = JSON.parse(localStorage.getItem("lcc_user") || "null");
  const { user, loading } = useAuthContext();   // get user from auth context
  const location = useLocation();

  if (loading) {
    // While checking token/refreshing, show a spinner or splash screen
    return (
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <h3>Loading...</h3>
      </div>
    );
  }
  
  if (!user) {
  // if there's no user, it redirects to login, and remember where user came from
  return <Navigate to="/login" state={{ from: location }} replace />;
    }
  return children; // when user is authenticated/if logged in, allow access/it lets the protected page render
 }

