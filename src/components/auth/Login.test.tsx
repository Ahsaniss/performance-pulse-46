import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from '../../pages/Auth';
import { describe, it, expect, vi } from 'vitest';

// Mock the AuthContext since Auth page uses it
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    signup: vi.fn(),
    user: null
  })
}));

describe('Frontend UI Tests', () => {
  it('Case 9: Login Page Renders Correctly', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );
    // Check if "Welcome Back" heading exists
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

    // Check if "Sign in" button exists
    // There might be multiple "Sign in" texts, so we look for the specific submit button
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
    
    // Check if email input exists
    // Based on the error output, the placeholder is "you@example.com"
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('Case 10: Toggle Sign Up Mode', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );
    
    // Initially "Welcome Back"
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    
    // Find the toggle button
    const toggleButton = screen.getByText(/Don't have an account\? Sign up/i);
    expect(toggleButton).toBeInTheDocument();
    
    // Click it
    fireEvent.click(toggleButton);
    
    // Now should see "Create Account"
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    
    // And "Full Name" input should appear
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });
});
