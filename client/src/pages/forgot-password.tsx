import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "If an account with that email exists, a reset link has been sent.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    forgotPasswordMutation.mutate(email.trim());
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-surface border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Reset Password
            </CardTitle>
            <p className="text-gray-400">
              Enter your email to receive a reset link
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/80 text-white"
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-green-400 text-sm">
                  Reset instructions have been sent via SMS to your phone number on file.
                </div>
                <div className="text-gray-400 text-sm">
                  Didn't receive it? Make sure your phone number is correct in your profile or try again.
                </div>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Try Again
                </Button>
              </div>
            )}

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