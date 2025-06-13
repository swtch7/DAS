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
import { Users, Clock, TrendingUp, DollarSign, CreditCard, CheckCircle, Copy, LogOut, Upload, Eye } from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-4 bg-zinc-800 border-zinc-700">
            <TabsTrigger value="stats" className="data-[state=active]:bg-yellow-600">
              Statistics
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
                                  className="bg-indigo-600 hover:bg-indigo-700 h-8 px-3 text-xs flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  View Photo
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
        </Tabs>
      </div>
    </div>
  );
}