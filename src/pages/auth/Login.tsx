import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithEmail, signInWithGoogle, userDetails, checkIsAdmin } = useAuth();
  
  // Check for error parameter in URL
  const errorMessage = searchParams.get("error");
  
  React.useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Attempting login with email:", email);
      
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message);
        return;
      }
      
      if (data?.user) {
        console.log("Login successful for user:", data.user.email);
        toast.success("Login successful!");
        
        // Check if user is admin first
        console.log("Checking admin status for email:", email);
        const isAdmin = await checkIsAdmin(email);
        console.log("Admin check result:", isAdmin);
        
        if (isAdmin) {
          console.log("User is admin, redirecting to admin dashboard");
          navigate("/admin-dashboard");
          return;
        }
        
        // Get user type from user metadata for non-admin users
        console.log("User is not admin, checking user metadata");
        const { data: userData } = await supabase.auth.getUser();
        const userType = userData?.user?.user_metadata?.user_type || 'student';
        console.log("User type from metadata:", userType);
        
        // Redirect based on user type
        const dashboardPath = userType === "student" 
          ? "/student-dashboard" 
          : "/company-dashboard";
        
        console.log("Redirecting to:", dashboardPath);
        navigate(dashboardPath);
      }
    } catch (error: any) {
      console.error("Login catch error:", error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success("Password reset link sent to your email");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm">Remember me</Label>
        </div>
        
        <Button type="submit" className="w-full btn-gradient" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isLoading} 
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
