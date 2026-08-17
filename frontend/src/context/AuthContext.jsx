import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  // OPTIMISTIC: paint instantly from the login-time cache — no login-page
  // flash while we check with the server
  const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem("chat-user")) || null);

  // AUTHORITATIVE: on every app load, ask the server "who am I right now?"
  // (the JWT cookie travels automatically). 200 → server truth wins, so
  // stale profiles self-heal. Anything else → no valid session → actually
  // log out instead of staying "logged in" with every API call failing.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        localStorage.setItem("chat-user", JSON.stringify(data));
        setAuthUser(data);
      })
      .catch(() => {
        localStorage.removeItem("chat-user");
        setAuthUser(null);
      });
  }, []);

  return <AuthContext.Provider value={{ authUser, setAuthUser }}>{children}</AuthContext.Provider>;
};
