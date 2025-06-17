import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Users, Clock, TrendingUp, DollarSign, CreditCard, CheckCircle, Copy, LogOut, Upload, Eye, UserCheck, Gamepad2, Calendar, Trash2, Database, Settings, GitBranch, ExternalLink, Shield, Globe, Mail, Smartphone, AlertTriangle, CheckSquare, Square, Circle } from "lucide-react";

interface CreditPurchaseRequest {
  id: number;
  userId: string;
  creditsRequested: number;
  usdAmount: string;
  status: string;
  adminUrl?: string;
  photoPath?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface RedemptionTransaction {
  id: number;
  userId: string;
  amount: number;
  usdValue: string;
  description: string;
  status: string;
  adminUrl?: string;
  createdAt: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;
}

interface AdminStats {
  totalUsers: number;
  recentLogins: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    lastLoginAt?: string;
    createdAt: string;
  }>;
  newUsersThisWeek: number;
}

interface UserDetail {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  credits: number;
  usdBalance: string;
  lastLoginAt?: string;
  createdAt: string;
  totalTransactions: number;
  totalPurchases: number;
  totalRedemptions: number;
  mostPlayedGame?: string;
  gamePlayCount: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState<number[]>([]);

  // Fetch admin statistics
  const { data: adminStats, isLoading: loadingStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch credit purchase requests
  const { data: creditRequests = [], isLoading: loadingRequests } = useQuery<CreditPurchaseRequest[]>({
    queryKey: ["/api/admin/credit-purchases"],
  });

  // Fetch redemption requests
  const { data: redemptions = [], isLoading: loadingRedemptions } = useQuery<RedemptionTransaction[]>({
    queryKey: ["/api/admin/redemptions"],
  });

  // Fetch all users
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery<UserDetail[]>({
    queryKey: ["/api/admin/users"],
  });

  // Update admin URL mutation
  const updateUrlMutation = useMutation({
    mutationFn: async ({ id, adminUrl, type }: { id: number; adminUrl: string; type: 'purchase' | 'redemption' }) => {
      const endpoint = type === 'purchase' 
        ? `/api/admin/credit-purchases/${id}`
        : `/api/admin/redemptions/${id}`;
      return apiRequest("PATCH", endpoint, { adminUrl });
    },
    onSuccess: () => {
      toast({
        title: "URL Updated",
        description: "URL sent via SMS to customer",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redemptions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update admin URL",
        variant: "destructive",
      });
    },
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/admin/credit-purchases/${id}/confirm`);
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "Credits have been added to user account and SMS sent",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-purchases"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch(`/api/admin/credit-purchases/${id}/upload-photo`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo Uploaded",
        description: "Photo has been uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-purchases"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone and will remove all their data.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleUpdateUrl = (id: number, type: 'purchase' | 'redemption') => {
    const key = `${type}-${id}`;
    const adminUrl = urlInputs[key];
    if (!adminUrl?.trim()) {
      toast({
        title: "Error",
        description: "Please enter an admin URL",
        variant: "destructive",
      });
      return;
    }
    updateUrlMutation.mutate({ id, adminUrl: adminUrl.trim(), type });
  };

  const handleConfirmPayment = (id: number) => {
    confirmPaymentMutation.mutate(id);
  };

  const handleUrlInputChange = (key: string, value: string) => {
    setUrlInputs(prev => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhotos(prev => [...prev, id]);
    uploadPhotoMutation.mutate({ id, file }, {
      onSettled: () => {
        setUploadingPhotos(prev => prev.filter(photoId => photoId !== id));
        // Reset the file input
        event.target.value = '';
      }
    });
  };

  const handleViewPhoto = (photoPath: string) => {
    // Open photo in new window/tab
    window.open(`/api/admin/photos/${photoPath}`, '_blank');
  };

  // Sort and color code requests
  const sortedCreditRequests = [...creditRequests].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const sortedRedemptions = [...redemptions].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusColor = (request: CreditPurchaseRequest | RedemptionTransaction) => {
    if (request.status === 'completed') return 'border-green-500 bg-green-900/20';
    if (request.adminUrl) return 'border-yellow-500 bg-yellow-900/20';
    return 'border-red-500 bg-red-900/20';
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Filter completed requests
  const completedCreditRequests = creditRequests.filter(req => req.status === 'completed');
  const openCreditRequests = creditRequests.filter(req => req.status !== 'completed');
  const completedRedemptions = redemptions.filter(req => req.status === 'completed');
  const openRedemptions = redemptions.filter(req => req.status !== 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-zinc-400 mt-2">Manage users, credit requests, and system statistics</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-zinc-600 text-white hover:bg-zinc-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-zinc-800 border-zinc-700">
            <TabsTrigger value="stats" className="data-[state=active]:bg-yellow-600">
              Statistics
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-yellow-600">
              Users
            </TabsTrigger>
            <TabsTrigger value="buy" className="data-[state=active]:bg-yellow-600">
              Open Buy Credits
            </TabsTrigger>
            <TabsTrigger value="redeem" className="data-[state=active]:bg-yellow-600">
              Redeem Credits
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-yellow-600">
              Completed Credits
            </TabsTrigger>
            <TabsTrigger value="schema" className="data-[state=active]:bg-yellow-600">
              <Database className="h-4 w-4 mr-1" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-yellow-600">
              <Settings className="h-4 w-4 mr-1" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {loadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                <p className="mt-2 text-zinc-400">Loading statistics...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-200">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{adminStats?.totalUsers || 0}</div>
                      <p className="text-xs text-zinc-400">Registered accounts</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-200">New Users (7 days)</CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{adminStats?.newUsersThisWeek || 0}</div>
                      <p className="text-xs text-zinc-400">New registrations</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-200">Active Requests</CardTitle>
                      <CreditCard className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {creditRequests.filter(r => r.status === 'pending').length}
                      </div>
                      <p className="text-xs text-zinc-400">Pending purchases</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-zinc-200 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-400" />
                      Recent User Activity
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Latest user logins and account activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {adminStats?.recentLogins?.length ? (
                        adminStats.recentLogins.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                            <div>
                              <p className="text-white font-medium">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.email}
                              </p>
                              <p className="text-zinc-400 text-sm">{user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-zinc-300 text-sm">
                                {user.lastLoginAt 
                                  ? `Last login: ${formatDistanceToNow(new Date(user.lastLoginAt))} ago`
                                  : 'Never logged in'}
                              </p>
                              <p className="text-zinc-500 text-xs">
                                Joined: {formatDistanceToNow(new Date(user.createdAt))} ago
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-400 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-zinc-200 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-400" />
                  All Users
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Comprehensive user information and activity tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                    <p className="mt-2 text-zinc-400">Loading users...</p>
                  </div>
                ) : allUsers.length > 0 ? (
                  <div className="space-y-4">
                    {allUsers.map((user) => (
                      <div key={user.id} className="border border-zinc-600 rounded-lg p-4 bg-zinc-700/50">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* User Basic Info */}
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-white text-lg">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.email}
                              </h3>
                              <p className="text-zinc-300 text-sm">{user.email}</p>
                              {user.phone && (
                                <p className="text-zinc-400 text-sm flex items-center gap-1">
                                  📱 {user.phone}
                                </p>
                              )}
                              {user.location && (
                                <p className="text-zinc-400 text-sm flex items-center gap-1">
                                  📍 {user.location}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-zinc-400" />
                              <span className="text-zinc-400">
                                Joined {formatDistanceToNow(new Date(user.createdAt))} ago
                              </span>
                            </div>
                            
                            {user.lastLoginAt && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-green-400" />
                                <span className="text-zinc-400">
                                  Last login {formatDistanceToNow(new Date(user.lastLoginAt))} ago
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Financial Info */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-white">Financial Overview</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Credits:</span>
                                <span className="text-yellow-400 font-medium">{user.credits.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">USD Balance:</span>
                                <span className="text-green-400 font-medium">${user.usdBalance}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Total Purchases:</span>
                                <span className="text-blue-400 font-medium">{user.totalPurchases}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Total Redemptions:</span>
                                <span className="text-purple-400 font-medium">{user.totalRedemptions}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-400 text-sm">Total Transactions:</span>
                                <span className="text-zinc-300 font-medium">{user.totalTransactions}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Gaming Activity */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-white">Gaming Activity</h4>
                            {user.mostPlayedGame ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Gamepad2 className="h-4 w-4 text-orange-400" />
                                  <span className="text-zinc-400 text-sm">Favorite Game:</span>
                                </div>
                                <div className="bg-zinc-600/50 rounded-lg p-3">
                                  <p className="text-white font-medium">{user.mostPlayedGame}</p>
                                  <p className="text-zinc-400 text-sm">{user.gamePlayCount} sessions</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-zinc-400 text-sm">
                                No gaming activity yet
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${user.credits >= 1000 ? 'border-yellow-400 text-yellow-400' : 'border-zinc-500 text-zinc-400'}`}
                              >
                                {user.credits >= 1000 ? 'VIP Player' : 'Regular Player'}
                              </Badge>
                              {user.totalPurchases >= 5 && (
                                <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                                  Frequent Buyer
                                </Badge>
                              )}
                              {user.lastLoginAt && new Date(user.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                                <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
                                  Active User
                                </Badge>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-zinc-600">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email)}
                                disabled={deleteUserMutation.isPending}
                                className="w-full"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-center py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buy" className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-zinc-200 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  Open Credit Purchase Requests
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Manage pending user credit purchase requests and payment confirmations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                    <p className="mt-2 text-zinc-400">Loading requests...</p>
                  </div>
                ) : openCreditRequests.length > 0 ? (
                  <div className="space-y-2">
                    {openCreditRequests.map((request: CreditPurchaseRequest) => (
                      <div key={request.id} className={`border rounded-lg p-3 ${getStatusColor(request)}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-white text-sm">
                                {request.user?.firstName && request.user?.lastName
                                  ? `${request.user.firstName} ${request.user.lastName}`
                                  : request.user?.email || 'Unknown User'}
                              </h3>
                              <span className="text-zinc-300 text-sm">
                                {request.creditsRequested} credits (${request.usdAmount})
                              </span>
                              <Badge variant={request.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {request.status}
                              </Badge>
                            </div>
                            <p className="text-zinc-400 text-xs">{request.user?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-zinc-400 text-xs">
                              {formatDistanceToNow(new Date(request.createdAt))} ago
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter admin URL"
                            value={urlInputs[`purchase-${request.id}`] || request.adminUrl || ''}
                            onChange={(e) => handleUrlInputChange(`purchase-${request.id}`, e.target.value)}
                            className="bg-zinc-600 border-zinc-500 text-white flex-1 h-8 text-sm"
                          />
                          <Button
                            onClick={() => handleUpdateUrl(request.id, 'purchase')}
                            disabled={updateUrlMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
                          >
                            Update
                          </Button>
                          <label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(request.id, e)}
                              className="hidden"
                              disabled={uploadingPhotos.includes(request.id)}
                            />
                            <Button
                              type="button"
                              disabled={uploadingPhotos.includes(request.id)}
                              className="bg-purple-600 hover:bg-purple-700 h-8 px-2 text-xs flex items-center gap-1"
                              onClick={(e) => {
                                e.preventDefault();
                                (e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement)?.click();
                              }}
                            >
                              <Upload className="h-3 w-3" />
                              {uploadingPhotos.includes(request.id) ? 'Uploading...' : 'Photo'}
                            </Button>
                          </label>
                          {request.photoPath && (
                            <Button
                              onClick={() => handleViewPhoto(request.photoPath!)}
                              className="bg-indigo-600 hover:bg-indigo-700 h-8 px-2 text-xs"
                              title="View uploaded photo"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          {request.adminUrl && (
                            <Button
                              onClick={() => handleCopyUrl(request.adminUrl!)}
                              className="bg-zinc-600 hover:bg-zinc-500 h-8 px-3 text-xs"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          {request.adminUrl && request.status !== 'completed' && (
                            <Button
                              onClick={() => handleConfirmPayment(request.id)}
                              disabled={confirmPaymentMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Confirm
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-center py-8">No credit purchase requests found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="redeem" className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-zinc-200">Credit Redemption Requests</CardTitle>
                <CardDescription className="text-zinc-400">
                  Manage user credit redemption requests and payment processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRedemptions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                    <p className="mt-2 text-zinc-400">Loading redemptions...</p>
                  </div>
                ) : openRedemptions.length > 0 ? (
                  <div className="space-y-2">
                    {openRedemptions.map((redemption: RedemptionTransaction) => (
                      <div key={redemption.id} className={`border rounded-lg p-3 ${getStatusColor(redemption)}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-white text-sm">
                                {redemption.userFirstName && redemption.userLastName
                                  ? `${redemption.userFirstName} ${redemption.userLastName}`
                                  : redemption.userEmail}
                              </h3>
                              <span className="text-zinc-300 text-sm">
                                {Math.abs(redemption.amount)} credits (${redemption.usdValue})
                              </span>
                              <Badge variant={redemption.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {redemption.status}
                              </Badge>
                            </div>
                            <p className="text-zinc-400 text-xs">{redemption.userEmail}</p>
                            <p className="text-zinc-300 text-xs">{redemption.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-zinc-400 text-xs">
                              {formatDistanceToNow(new Date(redemption.createdAt))} ago
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter admin URL"
                            value={urlInputs[`redemption-${redemption.id}`] || redemption.adminUrl || ''}
                            onChange={(e) => handleUrlInputChange(`redemption-${redemption.id}`, e.target.value)}
                            className="bg-zinc-600 border-zinc-500 text-white flex-1 h-8 text-sm"
                          />
                          <Button
                            onClick={() => handleUpdateUrl(redemption.id, 'redemption')}
                            disabled={updateUrlMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
                          >
                            Update
                          </Button>
                          {redemption.adminUrl && (
                            <Button
                              onClick={() => handleCopyUrl(redemption.adminUrl!)}
                              className="bg-zinc-600 hover:bg-zinc-500 h-8 px-3 text-xs"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-center py-8">No redemption requests found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-zinc-200 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Completed Credit Purchases
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Confirmed and processed credit purchases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {completedCreditRequests.length > 0 ? (
                    <div className="space-y-2">
                      {completedCreditRequests.map((request: CreditPurchaseRequest) => (
                        <div key={request.id} className="border border-green-500 bg-green-900/20 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium text-white text-sm">
                                  {request.user?.firstName && request.user?.lastName
                                    ? `${request.user.firstName} ${request.user.lastName}`
                                    : request.user?.email || 'Unknown User'}
                                </h3>
                                <span className="text-zinc-300 text-sm">
                                  {request.creditsRequested} credits (${request.usdAmount})
                                </span>
                                <Badge variant="default" className="text-xs bg-green-600">
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-zinc-400 text-xs">{request.user?.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-zinc-400 text-xs">
                                {formatDistanceToNow(new Date(request.createdAt))} ago
                              </p>
                            </div>
                          </div>
                          {(request.adminUrl || request.photoPath) && (
                            <div className="flex gap-2">
                              {request.adminUrl && (
                                <>
                                  <Input
                                    value={request.adminUrl}
                                    readOnly
                                    className="bg-zinc-600 border-zinc-500 text-white flex-1 h-8 text-sm"
                                  />
                                  <Button
                                    onClick={() => handleCopyUrl(request.adminUrl!)}
                                    className="bg-zinc-600 hover:bg-zinc-500 h-8 px-3 text-xs"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {request.photoPath && (
                                <Button
                                  onClick={() => handleViewPhoto(request.photoPath!)}
                                  className="bg-indigo-600 hover:bg-indigo-700 h-8 px-2 text-xs"
                                  title="View uploaded photo"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No completed credit purchases</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-zinc-200 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Completed Redemptions
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Processed redemption transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {completedRedemptions.length > 0 ? (
                    <div className="space-y-2">
                      {completedRedemptions.map((redemption: RedemptionTransaction) => (
                        <div key={redemption.id} className="border border-green-500 bg-green-900/20 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium text-white text-sm">
                                  {redemption.userFirstName && redemption.userLastName
                                    ? `${redemption.userFirstName} ${redemption.userLastName}`
                                    : redemption.userEmail}
                                </h3>
                                <span className="text-zinc-300 text-sm">
                                  {Math.abs(redemption.amount)} credits (${redemption.usdValue})
                                </span>
                                <Badge variant="default" className="text-xs bg-green-600">
                                  {redemption.status}
                                </Badge>
                              </div>
                              <p className="text-zinc-400 text-xs">{redemption.userEmail}</p>
                              <p className="text-zinc-300 text-xs">{redemption.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-zinc-400 text-xs">
                                {formatDistanceToNow(new Date(redemption.createdAt))} ago
                              </p>
                            </div>
                          </div>
                          {redemption.adminUrl && (
                            <div className="flex gap-2">
                              <Input
                                value={redemption.adminUrl}
                                readOnly
                                className="bg-zinc-600 border-zinc-500 text-white flex-1 h-8 text-sm"
                              />
                              <Button
                                onClick={() => handleCopyUrl(redemption.adminUrl!)}
                                className="bg-zinc-600 hover:bg-zinc-500 h-8 px-3 text-xs"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No completed redemptions</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Schema Diagram Tab */}
          <TabsContent value="schema" className="space-y-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5" />
                  Database Schema Overview
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Interactive visualization of the complete DASwallet database structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Database Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-zinc-400">Total Tables</span>
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">6</p>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-zinc-400">Relationships</span>
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">12</p>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-zinc-400">Active Records</span>
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">{adminStats?.totalUsers || 0}</p>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-zinc-400">Storage Used</span>
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">2.1 GB</p>
                  </div>
                </div>

                {/* Schema Diagram */}
                <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-600">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Core Tables */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        Core Tables
                      </h3>
                      
                      {/* Users Table */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-500/20 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-blue-300">users</h4>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                            {adminStats?.totalUsers || 0} rows
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-400 space-y-1">
                          <div>• id (PRIMARY KEY)</div>
                          <div>• email (UNIQUE)</div>
                          <div>• firstName, lastName</div>
                          <div>• phone, location</div>
                          <div>• credits, usdBalance</div>
                          <div>• createdAt, lastLoginAt</div>
                        </div>
                      </div>

                      {/* Sessions Table */}
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 hover:bg-green-500/20 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-green-300">sessions</h4>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300 text-xs">
                            Active
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-400 space-y-1">
                          <div>• sid (PRIMARY KEY)</div>
                          <div>• sess (JSON)</div>
                          <div>• expire (TIMESTAMP)</div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Tables */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-yellow-400" />
                        Financial Tables
                      </h3>

                      {/* Transactions Table */}
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-500/20 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-yellow-300">transactions</h4>
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 text-xs">
                            Latest
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-400 space-y-1">
                          <div>• id (PRIMARY KEY)</div>
                          <div>• userId → users.id (FK)</div>
                          <div>• type, amount, usdValue</div>
                          <div>• description, status</div>
                          <div>• adminUrl, createdAt</div>
                        </div>
                      </div>

                      {/* Credit Purchase Requests */}
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-500/20 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-purple-300">credit_purchase_requests</h4>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                            {creditRequests.length} pending
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-400 space-y-1">
                          <div>• id (PRIMARY KEY)</div>
                          <div>• userId → users.id (FK)</div>
                          <div>• creditsRequested, usdAmount</div>
                          <div>• status, adminUrl</div>
                          <div>• photoPath, createdAt</div>
                        </div>
                      </div>
                    </div>

                    {/* Security Tables */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-400" />
                        Security Tables
                      </h3>

                      {/* Password Reset Tokens */}
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 hover:bg-red-500/20 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-red-300">password_reset_tokens</h4>
                          <Badge variant="secondary" className="bg-red-500/20 text-red-300 text-xs">
                            Secure
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-400 space-y-1">
                          <div>• id (PRIMARY KEY)</div>
                          <div>• userId → users.id (FK)</div>
                          <div>• token (UNIQUE)</div>
                          <div>• expiresAt, usedAt</div>
                          <div>• createdAt</div>
                        </div>
                      </div>

                      {/* Relationship Indicators */}
                      <div className="bg-zinc-700/30 border border-zinc-600 rounded-lg p-4">
                        <h4 className="font-semibold text-zinc-300 mb-3">Relationships</h4>
                        <div className="text-xs text-zinc-400 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>users → transactions (1:many)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span>users → credit_requests (1:many)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span>users → reset_tokens (1:many)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>sessions (isolated)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schema Export Tools */}
                  <div className="mt-6 pt-6 border-t border-zinc-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">Schema Export</h4>
                        <p className="text-sm text-zinc-400">Export database schema for documentation</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-zinc-600 text-white hover:bg-zinc-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Export PNG
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-zinc-600 text-white hover:bg-zinc-700"
                        >
                          <Database className="h-4 w-4 mr-1" />
                          Export SQL
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Checklist Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Integration Checklist & System Status
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Comprehensive tracking of system integrations and infrastructure setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-zinc-400">Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400 mt-1">12/47</p>
                    <p className="text-xs text-zinc-500">25.5% Complete</p>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-zinc-400">In Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">8/47</p>
                    <p className="text-xs text-zinc-500">17% In Progress</p>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-zinc-400">Not Started</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400 mt-1">27/47</p>
                    <p className="text-xs text-zinc-500">57.5% Remaining</p>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-zinc-400">Est. Completion</span>
                    </div>
                    <p className="text-lg font-bold text-blue-400 mt-1">6-8 weeks</p>
                  </div>
                </div>

                {/* Integration Sections */}
                <div className="space-y-6">
                  {/* Game Platform Integration */}
                  <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 text-purple-400" />
                        Game Platform Integration
                      </h3>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                        3/15 Complete
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* SSO Integration */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-purple-300">SSO Integration</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">SSO login endpoint implemented</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Token decryption capability</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Signature verification setup</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Token expiration handling</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Automatic user login flow</span>
                          </div>
                        </div>
                      </div>

                      {/* Credit Sync */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-purple-300">Credit Sync Integration</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Credit balance sync API</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-zinc-300">Real-time update webhook</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Transaction logging</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Exit game credit sync</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Bi-directional testing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Third-Party Services */}
                  <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <ExternalLink className="h-5 w-5 text-blue-400" />
                        Third-Party Services
                      </h3>
                      <Badge variant="outline" className="border-red-500 text-red-400">
                        0/18 Complete
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Twilio SMS */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-blue-300 flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Twilio SMS
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Account created & verified</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Phone number purchased</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">SMS templates created</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Webhook endpoints</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Rate limits configured</span>
                          </div>
                        </div>
                      </div>

                      {/* Google Business Email */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-blue-300 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Google Business
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Workspace account created</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Custom domain configured</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">DKIM/SPF/DMARC setup</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Email templates</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Delivery monitoring</span>
                          </div>
                        </div>
                      </div>

                      {/* Apexpayout */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-blue-300 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Apexpayout
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Merchant account setup</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">API credentials configured</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Webhook endpoints</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Payment methods</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">PCI compliance</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure */}
                  <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-400" />
                        Infrastructure & Security
                      </h3>
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        9/14 Complete
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Domain & Hosting */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-300">Domain & Hosting</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Primary domain active</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">SSL certificate installed</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">DNS configuration</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Web hosting configured</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Database hosting</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Automated backups</span>
                          </div>
                        </div>
                      </div>

                      {/* Security */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-300">Security & Monitoring</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Admin MFA enabled</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Data encryption</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-zinc-300">Performance monitoring</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-zinc-300">Security auditing</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Penetration testing</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Circle className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm text-zinc-400">Incident response plan</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Priority Action Items
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                        <div>
                          <p className="text-white font-medium">Twilio Account Setup</p>
                          <p className="text-sm text-zinc-400">Required for SMS notifications. Estimated: 2-3 days</p>
                          <p className="text-xs text-red-400 mt-1">High Priority - Blocks user notifications</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                        <div>
                          <p className="text-white font-medium">Payment Gateway Integration</p>
                          <p className="text-sm text-zinc-400">Apexpayout setup for credit redemptions. Estimated: 1 week</p>
                          <p className="text-xs text-orange-400 mt-1">Medium Priority - Required for cash-outs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                        <div>
                          <p className="text-white font-medium">Game Platform SSO</p>
                          <p className="text-sm text-zinc-400">Complete token verification and user flow. Estimated: 3-4 days</p>
                          <p className="text-xs text-yellow-400 mt-1">Medium Priority - Enhances user experience</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}