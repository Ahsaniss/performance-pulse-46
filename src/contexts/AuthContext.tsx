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
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch user role from database
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const supabaseUser: User = {
          id: session.user.id,
          email: session.user.email!,
          role: roleData?.role || 'employee',
          name: profileData?.full_name || session.user.user_metadata.full_name || session.user.email!.split('@')[0],
          avatar: profileData?.avatar_url || session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
          department: profileData?.department || session.user.user_metadata.department,
          position: profileData?.position || session.user.user_metadata.position,
        };
        setUser(supabaseUser);
        localStorage.setItem('user', JSON.stringify(supabaseUser));
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Defer database calls to avoid deadlock
        setTimeout(async () => {
          // Fetch user role from database
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const supabaseUser: User = {
            id: session.user.id,
            email: session.user.email!,
            role: roleData?.role || 'employee',
            name: profileData?.full_name || session.user.user_metadata.full_name || session.user.email!.split('@')[0],
            avatar: profileData?.avatar_url || session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
            department: profileData?.department || session.user.user_metadata.department,
            position: profileData?.position || session.user.user_metadata.position,
          };
          setUser(supabaseUser);
          localStorage.setItem('user', JSON.stringify(supabaseUser));
        }, 0);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user role from database
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const supabaseUser: User = {
          id: data.user.id,
          email: data.user.email!,
          role: roleData?.role || 'employee',
          name: profileData?.full_name || data.user.user_metadata.full_name || data.user.email!.split('@')[0],
          avatar: profileData?.avatar_url || data.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
          department: profileData?.department || data.user.user_metadata.department,
          position: profileData?.position || data.user.user_metadata.position,
        };
        setUser(supabaseUser);
        localStorage.setItem('user', JSON.stringify(supabaseUser));
        toast.success(`Welcome back, ${supabaseUser.name}!`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Account created successfully! Please check your email to verify your account.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
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
