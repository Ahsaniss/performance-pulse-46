import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Mock authentication for frontend-only mode
type UserRole = 'admin' | 'employee' | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize default users and check for existing session
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            const userData = response.data.data;
            setUser({
              id: userData._id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        
        // Verify role matches if needed, or just trust the backend
        if (role && userData.role !== role) {
           // Optional: enforce role check if UI requires it, but usually backend is source of truth
           // For now, we'll warn but proceed, or throw error. 
           // The original code threw an error, so let's stick to that if strict.
           // However, usually login just logs you in as who you are.
           // Let's check if the user role matches the requested role for the UI context
           if (userData.role !== role) {
             throw new Error(`Account exists but is not a ${role}`);
           }
        }

        localStorage.setItem('token', token);
        
        const userObj = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        };

        setUser(userObj);
        toast.success(`Logged in as ${userData.role}`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    // TODO: Replace with your backend Google OAuth integration
    toast.error('Google login requires backend integration');
    throw new Error('Google login not available in frontend-only mode');
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole = 'employee') => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name: fullName,
        role: role // Use provided role
      });

      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        
        localStorage.setItem('token', token);

        const userObj = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        };

        setUser(userObj);
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Signup failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithGoogle, 
      signup, 
      logout, 
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
