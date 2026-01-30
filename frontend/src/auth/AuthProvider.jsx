//AuthProvider.jsx
//Wrap your app in a context provider (so useAuth can be accessed everywhere).
import React from "react";
import useAuth from "./useAuth.jsx";
import { AuthContext } from "./AuthContext.jsx";


export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
//export const useAuthContext = () => useContext(AuthContext);
// So you’re exporting both a component (AuthProvider) and a function (useAuthContext) from the same file. Fast Refresh prefers that a file either:
// exports only components, OR
//you move helper hooks/functions into another file.

 