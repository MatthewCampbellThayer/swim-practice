import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('swim_token');
    const stored = localStorage.getItem('swim_coach');
    if (token && stored) {
      try { setCoach(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  function login(token, coachData) {
    localStorage.setItem('swim_token', token);
    localStorage.setItem('swim_coach', JSON.stringify(coachData));
    setCoach(coachData);
  }

  function logout() {
    localStorage.removeItem('swim_token');
    localStorage.removeItem('swim_coach');
    setCoach(null);
  }

  return (
    <AuthContext.Provider value={{ coach, login, logout, loading, isSuper: coach?.is_superuser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
