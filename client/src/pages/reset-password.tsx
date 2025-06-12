import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
  const [resetComplete, setResetComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Extract token from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      toast({
        title: "Invalid reset link",
        description: "This reset link is invalid or has expired.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [setLocation, toast]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      await apiRequest("POST", "/api/auth/reset-password", data);
    },
    onSuccess: () => {
      setResetComplete(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: newPassword.trim(),
    });
  };

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-surface border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Password Reset Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="text-green-400">
                Your password has been successfully updated!
              </div>
              <div className="text-gray-400">
                You can now log in with your new password.
              </div>
              <Link href="/login">
                <Button className="w-full bg-primary hover:bg-primary/80 text-white">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-surface border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Reset Your Password
            </CardTitle>
            <p className="text-gray-400">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300 flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>New Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Confirm Password</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="text-xs text-gray-400">
                Password must be at least 6 characters long
              </div>

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-primary hover:bg-primary/80 text-white"
              >
                {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-400">
              <Link href="/login">
                <a className="text-primary hover:underline flex items-center justify-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Login</span>
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}