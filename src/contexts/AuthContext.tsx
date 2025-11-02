import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

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
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
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
    // Check for existing session in localStorage
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      // TODO: Replace with your backend authentication API
      const usersData = localStorage.getItem('mockUsers');
      const users = usersData ? JSON.parse(usersData) : [];
      
      const foundUser = users.find((u: any) => u.email === email && u.password === password && u.role === role);
      
      if (!foundUser) {
        toast.error('Invalid email or password, or incorrect role');
        throw new Error('Invalid credentials');
      }

      const userObj = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundUser.email}`,
      };

      setUser(userObj);
      localStorage.setItem('mockUser', JSON.stringify(userObj));
      
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    // TODO: Replace with your backend Google OAuth integration
    toast.error('Google login requires backend integration');
    throw new Error('Google login not available in frontend-only mode');
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      // TODO: Replace with your backend registration API
      const usersData = localStorage.getItem('mockUsers');
      const users = usersData ? JSON.parse(usersData) : [];
      
      if (users.find((u: any) => u.email === email)) {
        toast.error('User with this email already exists');
        throw new Error('User already exists');
      }

      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password, // WARNING: Never store plain text passwords in production!
        name: fullName,
        role,
      };

      users.push(newUser);
      localStorage.setItem('mockUsers', JSON.stringify(users));

      const userObj = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.email}`,
      };

      setUser(userObj);
      localStorage.setItem('mockUser', JSON.stringify(userObj));
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = () => {
    // TODO: Replace with your backend logout API
    setUser(null);
    localStorage.removeItem('mockUser');
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
