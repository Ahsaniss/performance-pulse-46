import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'employee' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN = {
  email: 'admin@performancepulse.com',
  password: 'admin123',
  role: 'admin' as UserRole,
  name: 'System Administrator'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const supabaseUser: User = {
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata.role || 'employee',
          name: session.user.user_metadata.name || session.user.email!.split('@')[0],
          avatar: session.user.user_metadata.avatar_url,
          department: session.user.user_metadata.department,
          position: session.user.user_metadata.position,
        };
        setUser(supabaseUser);
        localStorage.setItem('user', JSON.stringify(supabaseUser));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const supabaseUser: User = {
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata.role || 'employee',
          name: session.user.user_metadata.name || session.user.email!.split('@')[0],
          avatar: session.user.user_metadata.avatar_url,
          department: session.user.user_metadata.department,
          position: session.user.user_metadata.position,
        };
        setUser(supabaseUser);
        localStorage.setItem('user', JSON.stringify(supabaseUser));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast.success('Redirecting to Google Sign In...');
    } catch (error: any) {
      toast.error(error.message || 'Google Sign In failed');
      throw error;
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      if (
        role === 'admin' &&
        email === DEFAULT_ADMIN.email &&
        password === DEFAULT_ADMIN.password
      ) {
        const adminUser: User = {
          id: 'admin-001',
          email: DEFAULT_ADMIN.email,
          role: 'admin',
          name: DEFAULT_ADMIN.name,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
          department: 'Management',
          position: 'System Administrator',
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        toast.success('Welcome back, Administrator!');
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        role: role!,
        name: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        department: role === 'admin' ? 'Management' : 'General',
        position: role === 'admin' ? 'Administrator' : 'Employee',
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success(`Welcome back, ${newUser.name}!`);
    } catch (error: any) {
      toast.error('Login failed. Please try again.');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      if (email === DEFAULT_ADMIN.email) {
        toast.error('This email is reserved for system administrator.');
        throw new Error('Email already in use');
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        role: role!,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        department: role === 'admin' ? 'Management' : 'General',
        position: role === 'admin' ? 'Administrator' : 'Employee',
      };

      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error('Signup failed. Please try again.');
      throw error;
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, isAuthenticated: !!user }}>
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
