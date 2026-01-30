//frontend/src/auth/useAuthContext.jsx
//(you’ll need to export { AuthContext } in AuthProvider.jsx for this to work))
//throw helpful errors if useAuthContext is used outside of AuthProvider
import { useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside an AuthProvider");
  }
  return ctx;
};
