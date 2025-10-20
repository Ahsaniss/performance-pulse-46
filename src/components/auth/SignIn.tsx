import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, role);
      navigate(role === 'admin' ? '/admin' : '/employee');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to Performance Pulse</p>
        </div>
        
        {/* Google Sign In */}
        <Button 
          onClick={handleGoogleSignIn}
          variant="outline" 
          className="w-full mb-4"
          size="lg"
        >
          <Mail className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        {/* Default Admin Credentials Info */}
        <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-primary">Default Admin Credentials</p>
          </div>
          <p className="text-xs text-muted-foreground">Email: <span className="font-mono">admin@performancepulse.com</span></p>
          <p className="text-xs text-muted-foreground">Password: <span className="font-mono">admin123</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Sign in as</Label>
            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant={role === 'admin' ? 'default' : 'outline'}
                onClick={() => setRole('admin')}
                className="flex-1"
              >
                Admin
              </Button>
              <Button
                type="button"
                variant={role === 'employee' ? 'default' : 'outline'}
                onClick={() => setRole('employee')}
                className="flex-1"
              >
                Employee
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary hover:underline">
              Sign Up
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
};
