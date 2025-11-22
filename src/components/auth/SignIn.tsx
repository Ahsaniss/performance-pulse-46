import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { GoogleLogin } from '@react-oauth/google';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/employee');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await login(email, password, role);
      // Navigation will be handled by useEffect when user state updates
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
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
        <div className="flex justify-center mb-4">
          <GoogleLogin
            onSuccess={credentialResponse => {
              if (credentialResponse.credential) {
                loginWithGoogle(credentialResponse.credential);
              }
            }}
            onError={() => {
              console.log('Login Failed');
            }}
            useOneTap
          />
        </div>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        {/* Info box */}
        <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-primary">Getting Started</p>
          </div>
          <p className="text-xs text-muted-foreground">Sign up to create your admin or employee account</p>
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
          <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
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
