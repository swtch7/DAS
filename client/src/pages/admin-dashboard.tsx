import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DollarSign, CreditCard, Link, Save } from "lucide-react";

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

  // Fetch credit purchase requests
  const { data: creditRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["/api/admin/credit-purchases"],
  });

  // Fetch redemption transactions
  const { data: redemptions = [], isLoading: loadingRedemptions } = useQuery({
    queryKey: ["/api/admin/redemptions"],
  });

  // Update credit purchase request URL
  const updateCreditRequestMutation = useMutation({
    mutationFn: async ({ id, adminUrl }: { id: number; adminUrl: string }) => {
      await apiRequest("PATCH", `/api/admin/credit-purchases/${id}`, { adminUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-purchases"] });
      toast({
        title: "URL updated",
        description: "Credit purchase request URL has been saved",
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

  // Update redemption transaction URL
  const updateRedemptionMutation = useMutation({
    mutationFn: async ({ id, adminUrl }: { id: number; adminUrl: string }) => {
      await apiRequest("PATCH", `/api/admin/redemptions/${id}`, { adminUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redemptions"] });
      toast({
        title: "URL updated",
        description: "Redemption transaction URL has been saved",
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

  const handleUrlChange = (type: string, id: number, value: string) => {
    setUrlInputs(prev => ({ ...prev, [`${type}-${id}`]: value }));
  };

  const handleSaveUrl = (type: 'credit' | 'redemption', id: number) => {
    const url = urlInputs[`${type}-${id}`];
    if (!url?.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (type === 'credit') {
      updateCreditRequestMutation.mutate({ id, adminUrl: url.trim() });
    } else {
      updateRedemptionMutation.mutate({ id, adminUrl: url.trim() });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pending", className: "bg-yellow-600" },
      processing: { label: "Processing", className: "bg-blue-600" },
      completed: { label: "Completed", className: "bg-green-600" },
      failed: { label: "Failed", className: "bg-red-600" },
      payment_link_sent: { label: "Link Sent", className: "bg-purple-600" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, className: "bg-gray-600" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage credit purchases and redemptions</p>
        </div>

        <Tabs defaultValue="buy" className="space-y-6">
          <TabsList className="bg-surface border-gray-700">
            <TabsTrigger value="buy" className="data-[state=active]:bg-primary">
              <DollarSign className="h-4 w-4 mr-2" />
              Buy Credits
            </TabsTrigger>
            <TabsTrigger value="redeem" className="data-[state=active]:bg-primary">
              <CreditCard className="h-4 w-4 mr-2" />
              Redeem Credits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
            <Card className="bg-surface border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Credit Purchase Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading requests...</p>
                  </div>
                ) : !creditRequests?.length ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No credit purchase requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditRequests.map((request: CreditPurchaseRequest) => (
                      <div key={request.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-white font-semibold">
                              {request.user?.firstName} {request.user?.lastName}
                            </h3>
                            <p className="text-gray-400 text-sm">{request.user?.email}</p>
                            <p className="text-gray-400 text-sm">
                              {format(new Date(request.createdAt), 'MMM dd, yyyy at h:mm a')}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Credits Requested</p>
                            <p className="text-white font-semibold">{request.creditsRequested.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">USD Amount</p>
                            <p className="text-white font-semibold">${request.usdAmount}</p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <Input
                              placeholder={request.adminUrl || "Add payment URL"}
                              value={urlInputs[`credit-${request.id}`] || request.adminUrl || ''}
                              onChange={(e) => handleUrlChange('credit', request.id, e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <Button
                            onClick={() => handleSaveUrl('credit', request.id)}
                            disabled={updateCreditRequestMutation.isPending}
                            className="bg-primary hover:bg-primary/80"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {request.adminUrl && (
                          <div className="mt-2">
                            <a
                              href={request.adminUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm flex items-center space-x-1"
                            >
                              <Link className="h-3 w-3" />
                              <span>View Payment Link</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="redeem">
            <Card className="bg-surface border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Credit Redemption Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRedemptions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading redemptions...</p>
                  </div>
                ) : !redemptions?.length ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No redemption requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {redemptions.map((redemption: RedemptionTransaction) => (
                      <div key={redemption.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-white font-semibold">
                              {redemption.userFirstName} {redemption.userLastName}
                            </h3>
                            <p className="text-gray-400 text-sm">{redemption.userEmail}</p>
                            <p className="text-gray-400 text-sm">
                              {format(new Date(redemption.createdAt), 'MMM dd, yyyy at h:mm a')}
                            </p>
                          </div>
                          {getStatusBadge(redemption.status)}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Credits Redeemed</p>
                            <p className="text-white font-semibold">{Math.abs(redemption.amount).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">USD Value</p>
                            <p className="text-white font-semibold">${redemption.usdValue}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Description</p>
                            <p className="text-white text-sm">{redemption.description}</p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <Input
                              placeholder={redemption.adminUrl || "Add payment confirmation URL"}
                              value={urlInputs[`redemption-${redemption.id}`] || redemption.adminUrl || ''}
                              onChange={(e) => handleUrlChange('redemption', redemption.id, e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <Button
                            onClick={() => handleSaveUrl('redemption', redemption.id)}
                            disabled={updateRedemptionMutation.isPending}
                            className="bg-primary hover:bg-primary/80"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {redemption.adminUrl && (
                          <div className="mt-2">
                            <a
                              href={redemption.adminUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm flex items-center space-x-1"
                            >
                              <Link className="h-3 w-3" />
                              <span>View Payment Confirmation</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}