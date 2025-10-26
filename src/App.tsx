import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SignIn } from "./components/auth/SignIn";
import { SignUp } from "./components/auth/SignUp";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminDashboard } from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

const queryClient = new QueryClient();

// ✅ Define routes with createBrowserRouter
const router = createBrowserRouter(
  [
    { path: "/", element: <Navigate to="/signin" replace /> },
    { path: "/signin", element: <SignIn /> },
    { path: "/signup", element: <SignUp /> },
    {
      path: "/admin",
      element: (
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/employee",
      element: (
        <ProtectedRoute>
          <EmployeeDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/employee/:employeeId",
      element: (
        <ProtectedRoute>
          <EmployeeDashboard />
        </ProtectedRoute>
      ),
    },
    { path: "*", element: <Navigate to="/signin" replace /> },
  ],
  {
    // ✅ Fix React Router Future Flag warnings
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {/* ✅ Use RouterProvider instead of BrowserRouter */}
          <RouterProvider router={router} />

          <Toaster />
          <Sonner position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
