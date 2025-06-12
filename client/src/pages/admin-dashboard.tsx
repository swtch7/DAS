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
import { Users, Clock, TrendingUp, DollarSign, CreditCard, CheckCircle } from "lucide-react";

interface CreditPurchaseRequest {
  id: number;
  userId: string;
  creditsRequested: number;
  usdAmount: string;
  status: string;
  adminUrl?: string;
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
      return apiRequest(endpoint, "PATCH", { adminUrl });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin URL updated successfully",
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
      return apiRequest(`/api/admin/credit-purchases/${id}/confirm`, "PATCH");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-zinc-400 mt-2">Manage users, credit requests, and system statistics</p>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800 border-zinc-700">
            <TabsTrigger value="stats" className="data-[state=active]:bg-yellow-600">
              Statistics
            </TabsTrigger>
            <TabsTrigger value="buy" className="data-[state=active]:bg-yellow-600">
              Buy Credits
            </TabsTrigger>
            <TabsTrigger value="redeem" className="data-[state=active]:bg-yellow-600">
              Redeem Credits
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
                  Credit Purchase Requests
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Manage user credit purchase requests and payment confirmations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                    <p className="mt-2 text-zinc-400">Loading requests...</p>
                  </div>
                ) : creditRequests.length > 0 ? (
                  <div className="space-y-4">
                    {creditRequests.map((request: CreditPurchaseRequest) => (
                      <div key={request.id} className="border border-zinc-600 rounded-lg p-4 bg-zinc-700">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {request.user?.firstName && request.user?.lastName
                                ? `${request.user.firstName} ${request.user.lastName}`
                                : request.user?.email || 'Unknown User'}
                            </h3>
                            <p className="text-zinc-400 text-sm">{request.user?.email}</p>
                            <p className="text-zinc-300 text-sm">
                              {request.creditsRequested} credits (${request.usdAmount})
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                              {request.status}
                            </Badge>
                            <p className="text-zinc-400 text-xs mt-1">
                              {formatDistanceToNow(new Date(request.createdAt))} ago
                            </p>
                          </div>
                        </div>

                        {request.adminUrl && (
                          <div className="mb-3 p-2 bg-zinc-600 rounded text-sm">
                            <strong className="text-zinc-300">Admin URL:</strong>
                            <br />
                            <a href={request.adminUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-yellow-400 hover:underline break-all">
                              {request.adminUrl}
                            </a>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter admin URL"
                              value={urlInputs[`purchase-${request.id}`] || ''}
                              onChange={(e) => handleUrlInputChange(`purchase-${request.id}`, e.target.value)}
                              className="bg-zinc-600 border-zinc-500 text-white flex-1"
                            />
                            <Button
                              onClick={() => handleUpdateUrl(request.id, 'purchase')}
                              disabled={updateUrlMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Update URL
                            </Button>
                          </div>

                          {request.adminUrl && request.status !== 'completed' && (
                            <Button
                              onClick={() => handleConfirmPayment(request.id)}
                              disabled={confirmPaymentMutation.isPending}
                              className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirm Payment Complete
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
                ) : redemptions.length > 0 ? (
                  <div className="space-y-4">
                    {redemptions.map((redemption: RedemptionTransaction) => (
                      <div key={redemption.id} className="border border-zinc-600 rounded-lg p-4 bg-zinc-700">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {redemption.userFirstName && redemption.userLastName
                                ? `${redemption.userFirstName} ${redemption.userLastName}`
                                : redemption.userEmail}
                            </h3>
                            <p className="text-zinc-400 text-sm">{redemption.userEmail}</p>
                            <p className="text-zinc-300 text-sm">{redemption.description}</p>
                            <p className="text-zinc-300 text-sm">
                              {Math.abs(redemption.amount)} credits (${redemption.usdValue})
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={redemption.status === 'completed' ? 'default' : 'secondary'}>
                              {redemption.status}
                            </Badge>
                            <p className="text-zinc-400 text-xs mt-1">
                              {formatDistanceToNow(new Date(redemption.createdAt))} ago
                            </p>
                          </div>
                        </div>

                        {redemption.adminUrl && (
                          <div className="mb-3 p-2 bg-zinc-600 rounded text-sm">
                            <strong className="text-zinc-300">Admin URL:</strong>
                            <br />
                            <a href={redemption.adminUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-yellow-400 hover:underline break-all">
                              {redemption.adminUrl}
                            </a>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter admin URL"
                            value={urlInputs[`redemption-${redemption.id}`] || ''}
                            onChange={(e) => handleUrlInputChange(`redemption-${redemption.id}`, e.target.value)}
                            className="bg-zinc-600 border-zinc-500 text-white"
                          />
                          <Button
                            onClick={() => handleUpdateUrl(redemption.id, 'redemption')}
                            disabled={updateUrlMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Update URL
                          </Button>
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
        </Tabs>
      </div>
    </div>
  );
}