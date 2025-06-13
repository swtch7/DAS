import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useEffect } from "react";
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
  Home, 
  User as UserIcon, 
  History, 
  LogOut,
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
  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: userData?.phone || "",
      location: userData?.location || "",
    },
  });

  // Update form values when user data changes
  useEffect(() => {
    if (userData) {
      form.reset({
        phone: userData.phone || "",
        location: userData.location || "",
      });
    }
  }, [userData, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-zinc-800/50 backdrop-blur-sm border-r border-zinc-700 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">Gaming Wallet</span>
            </div>
            
            <nav className="space-y-2">
              <Link href="/">
                <a className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors">
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </a>
              </Link>
              
              <Link href="/profile">
                <a className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors bg-zinc-700/30 text-white">
                  <UserIcon className="h-5 w-5" />
                  <span>Profile</span>
                </a>
              </Link>
              
              <Link href="/games">
                <a className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors">
                  <Gamepad2 className="h-5 w-5" />
                  <span>Games</span>
                </a>
              </Link>
              
              <Link href="/transactions">
                <a className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors">
                  <History className="h-5 w-5" />
                  <span>Transaction History</span>
                </a>
              </Link>
              
              <Link href="/api/logout">
                <a className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </a>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Profile Settings</h1>
            <p className="text-gray-400 text-lg">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Information */}
          <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </Label>
                  <Input
                    value={userData?.email || ""}
                    disabled
                    className="bg-zinc-700 border-zinc-600 text-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">First Name</Label>
                  <Input
                    value={userData?.firstName || ""}
                    disabled
                    className="bg-zinc-700 border-zinc-600 text-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Last Name</Label>
                  <Input
                    value={userData?.lastName || ""}
                    disabled
                    className="bg-zinc-700 border-zinc-600 text-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Credits</Label>
                  <Input
                    value={userData?.credits?.toLocaleString() || "0"}
                    disabled
                    className="bg-zinc-700 border-zinc-600 text-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Profile Fields */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </Label>
                    <Input
                      {...form.register("phone")}
                      placeholder="Enter your phone number"
                      className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-red-400 text-sm">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </Label>
                    <Input
                      {...form.register("location")}
                      placeholder="Enter your location"
                      className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                    />
                    {form.formState.errors.location && (
                      <p className="text-red-400 text-sm">
                        {form.formState.errors.location.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Link href="/">
                    <Button variant="outline" className="border-zinc-600 text-gray-300 hover:text-white">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-medium hover:from-yellow-500 hover:to-orange-600"
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}