import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Gamepad2, 
  Bell, 
  Home, 
  User, 
  History, 
  ExternalLink, 
  LogOut,
  ArrowLeft,
  Phone,
  MapPin,
  Mail,
  UserCircle
} from "lucide-react";

const profileSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  location: z.string().min(2, "Location is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: userData?.phone || "",
      location: userData?.location || "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100">
      {/* Navigation Header */}
      <nav className="bg-surface border-b border-gray-700 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Gamepad2 className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold text-white">DAS Gaming Wallet</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {userData?.firstName?.charAt(0) || "U"}
                </span>
              </div>
              <span className="text-sm text-gray-300">
                {userData?.firstName || "User"}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-surface rounded-xl p-6 border border-gray-700">
            <nav className="space-y-2">
              <Link href="/">
                <a className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </a>
              </Link>
              <Link href="/profile">
                <a className="flex items-center space-x-3 px-3 py-2 bg-primary/20 text-primary rounded-lg font-medium">
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </a>
              </Link>
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <History className="h-5 w-5" />
                <span>Transaction History</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <ExternalLink className="h-5 w-5" />
                <span>Game Site</span>
              </button>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
          </div>

          {/* Profile Information */}
          <Card className="bg-surface border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Read-only fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">First Name</Label>
                  <Input
                    value={userData?.firstName || ""}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Last Name</Label>
                  <Input
                    value={userData?.lastName || ""}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </Label>
                <Input
                  value={userData?.email || ""}
                  disabled
                  className="bg-gray-700 border-gray-600 text-gray-400"
                />
              </div>

              {/* Editable fields */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300 flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="+1 (555) 123-4567"
                    className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-red-400 text-sm">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-300 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </Label>
                  <Input
                    id="location"
                    {...form.register("location")}
                    placeholder="City, State"
                    className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {form.formState.errors.location && (
                    <p className="text-red-400 text-sm">{form.formState.errors.location.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Game Credentials */}
          <Card className="bg-surface border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Gamepad2 className="h-5 w-5" />
                <span>Game Credentials</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Game Username</Label>
                  <Input
                    value={userData?.gameUsername || "Not generated"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Game Password</Label>
                  <Input
                    type="password"
                    value={userData?.gamePassword || "Not generated"}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Game credentials are automatically generated when you first access the game site.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
