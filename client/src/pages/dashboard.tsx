import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Transaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { 
  Bell, 
  ExternalLink, 
  Coins,
  DollarSign,
  Plus,
  ArrowRightLeft,
  TrendingUp,
  Gamepad2,
  ShoppingCart,
  Clock
} from "lucide-react";
import CreditPurchaseModal from "@/components/credit-purchase-modal";
import RedeemModal from "@/components/redeem-modal";
import PurchaseTrackerSidebar from "@/components/purchase-tracker-sidebar";
import PhoneNumberModal from "@/components/phone-number-modal";
import CollapsibleSidebar from "@/components/collapsible-sidebar";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'buy' | 'redeem' | null>(null);

  const [latestPurchase, setLatestPurchase] = useState<{
    id: number;
    creditsRequested: number;
    usdAmount: string;
  } | null>(null);

  // Query active purchases for current user
  const { data: activePurchases } = useQuery({
    queryKey: ['/api/admin/credit-requests'],
    select: (data: any[]) => data?.filter(purchase => 
      purchase.userId === user?.id && 
      purchase.status !== 'completed' && 
      purchase.status !== 'cancelled'
    ) || [],
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Update latest purchase based on active purchases
  useEffect(() => {
    if (activePurchases && activePurchases.length > 0) {
      const latest = activePurchases[0];
      if (!latestPurchase || latestPurchase.id !== latest.id) {
        setLatestPurchase({
          id: latest.id,
          creditsRequested: latest.creditsRequested,
          usdAmount: latest.usdAmount
        });
      }
    } else if (activePurchases && activePurchases.length === 0 && latestPurchase) {
      setLatestPurchase(null);
      setShowTracker(false);
    }
  }, [activePurchases, latestPurchase]);

  // Check for existing active purchase on load and clear if user changed
  useEffect(() => {
    const activePurchase = localStorage.getItem('activePurchase');
    const lastUserId = localStorage.getItem('lastUserId');
    const currentUserId = user?.id;
    
    if (activePurchase && currentUserId) {
      try {
        // Clear tracker if user changed
        if (lastUserId && lastUserId !== currentUserId) {
          localStorage.removeItem('activePurchase');
          localStorage.removeItem('lastUserId');
          return;
        }
        
        const purchase = JSON.parse(activePurchase);
        setLatestPurchase(purchase);
        setShowTracker(true);
        localStorage.setItem('lastUserId', currentUserId);
      } catch (error) {
        localStorage.removeItem('activePurchase');
        localStorage.removeItem('lastUserId');
      }
    } else if (currentUserId) {
      localStorage.setItem('lastUserId', currentUserId);
    }
  }, [user?.id]);

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Generate game credentials mutation
  const gameCredentialsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/user/game-credentials");
    },
    onSuccess: () => {
      toast({
        title: "Welcome SMS Sent!",
        description: "Check your phone for the game site link.",
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleGameSiteAccess = () => {
    // Generate credentials if needed and redirect to auto-login
    if (userData && !userData.gameUsername) {
      gameCredentialsMutation.mutate();
    }
    // Open auto-login page that will submit credentials to game site
    window.open("/api/game-site-login", "_blank");
  };

  const checkPhoneNumber = (action: 'buy' | 'redeem') => {
    if (!userData?.phone) {
      setPendingAction(action);
      setShowPhoneModal(true);
      return false;
    }
    return true;
  };

  const handleBuyCredits = () => {
    if (checkPhoneNumber('buy')) {
      setShowBuyModal(true);
    }
  };

  const handleRedeemCredits = () => {
    if (checkPhoneNumber('redeem')) {
      setShowRedeemModal(true);
    }
  };

  const handlePhoneUpdated = () => {
    // After phone is updated, proceed with the pending action
    if (pendingAction === 'buy') {
      setShowBuyModal(true);
    } else if (pendingAction === 'redeem') {
      setShowRedeemModal(true);
    }
    setPendingAction(null);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const credits = userData?.credits || 0;
  const usdValue = credits * 0.01;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">


      <div className="flex">
        <CollapsibleSidebar onLogout={handleLogout} />

        {/* Purchase Progress Indicator - Fixed position */}
        {latestPurchase && !showTracker && (
          <div className="fixed bottom-6 right-6 z-30">
            <Button
              onClick={() => setShowTracker(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full p-4 animate-pulse"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:block">Purchase in Progress</span>
              </div>
            </Button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8 pt-20 lg:pt-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {userData?.firstName || "User"}!
            </h2>
            <p className="text-purple-100">
              Manage your gaming credits and access Golden Dragon City seamlessly.
            </p>
          </div>

          {/* Credits Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
            <Card className="bg-surface border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Available Credits</h3>
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Coins className="text-accent h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-accent">
                    {credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Gaming Credits</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">USD Value</h3>
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-500 h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-500">
                    ${usdValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Current Market Rate</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-surface border-gray-700 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={handleBuyCredits}
                  className="bg-primary hover:bg-primary/80 text-white rounded-lg p-4 h-auto flex-col space-y-2 transition-colors group"
                >
                  <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <div className="font-medium">Buy Credits</div>
                  <div className="text-sm text-purple-200">Purchase gaming credits</div>
                </Button>
                
                <Button
                  onClick={handleRedeemCredits}
                  className="bg-accent hover:bg-accent/80 text-white rounded-lg p-4 h-auto flex-col space-y-2 transition-colors group"
                >
                  <ArrowRightLeft className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <div className="font-medium">Redeem Credits</div>
                  <div className="text-sm text-green-100">Convert to cash</div>
                </Button>
                
                <Button
                  onClick={handleGameSiteAccess}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 h-auto flex-col space-y-2 transition-colors group relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-20">
                    <img 
                      src="/attached_assets/golden%20dragon_1749824618883.png"
                      alt="Golden Dragon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative z-10 flex flex-col items-center space-y-2">
                    <Gamepad2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <div className="font-medium">Play Game</div>
                    <div className="text-sm text-blue-100">Launch Golden Dragon City</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-surface border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No transactions yet. Start by purchasing credits!
                  </div>
                ) : (
                  transactions.slice(0, 5).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'purchase' ? 'bg-accent/20' :
                          transaction.type === 'redemption' ? 'bg-green-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {transaction.type === 'purchase' ? (
                            <Plus className={`h-5 w-5 ${transaction.type === 'purchase' ? 'text-accent' : 'text-blue-500'}`} />
                          ) : transaction.type === 'redemption' ? (
                            <ArrowRightLeft className="h-5 w-5 text-green-500" />
                          ) : (
                            <Gamepad2 className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {transaction.type === 'purchase' ? 'Credit Purchase' :
                             transaction.type === 'redemption' ? 'Credit Redemption' :
                             'Game Session'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          transaction.amount > 0 ? 'text-accent' : 
                          transaction.type === 'redemption' ? 'text-green-500' :
                          'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} credits
                        </div>
                        <div className="text-sm text-gray-400">
                          {transaction.usdValue ? `$${parseFloat(transaction.usdValue).toFixed(2)}` : '-'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modals */}
      <CreditPurchaseModal 
        isOpen={showBuyModal} 
        onClose={() => setShowBuyModal(false)}
        onPurchaseSubmitted={(purchase) => {
          setLatestPurchase(purchase);
          setShowTracker(true);
          localStorage.setItem('activePurchase', JSON.stringify(purchase));
        }}
      />
      <RedeemModal 
        isOpen={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)}
        userCredits={credits}
      />
      <PhoneNumberModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onPhoneUpdated={handlePhoneUpdated}
      />

      {/* Purchase Tracker Sidebar */}
      {showTracker && latestPurchase && (
        <>
          {/* Backdrop - clicking dismisses tracker but keeps progress indicator */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowTracker(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full z-50">
            <PurchaseTrackerSidebar
              purchaseId={latestPurchase.id}
              creditsRequested={latestPurchase.creditsRequested}
              usdAmount={latestPurchase.usdAmount}
              onComplete={() => {
                setShowTracker(false);
                setLatestPurchase(null);
                localStorage.removeItem('activePurchase');
                queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
              }}
              onClose={() => {
                // Only hide tracker, keep latestPurchase so progress indicator shows
                setShowTracker(false);
              }}
            />
          </div>
        </>
      )}

    </div>
  );
}
