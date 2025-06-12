import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import { 
  Gamepad2, 
  Bell, 
  Home, 
  User, 
  History, 
  ExternalLink, 
  LogOut,
  Coins,
  DollarSign,
  Plus,
  ArrowRightLeft,
  TrendingUp
} from "lucide-react";
import CreditPurchaseModal from "@/components/credit-purchase-modal";
import RedeemModal from "@/components/redeem-modal";
import PurchaseTrackerModal from "@/components/purchase-tracker-modal";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [latestPurchase, setLatestPurchase] = useState<{
    id: number;
    creditsRequested: number;
    usdAmount: string;
  } | null>(null);

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
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
                <a className="flex items-center space-x-3 px-3 py-2 bg-primary/20 text-primary rounded-lg font-medium">
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </a>
              </Link>
              <Link href="/profile">
                <a className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </a>
              </Link>
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <History className="h-5 w-5" />
                <span>Transaction History</span>
              </button>
              <button
                onClick={handleGameSiteAccess}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
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

        {/* Main Dashboard */}
        <main className="lg:col-span-3 space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Card className="bg-surface border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowBuyModal(true)}
                  className="bg-primary hover:bg-primary/80 text-white rounded-lg p-4 h-auto flex-col space-y-2 transition-colors group"
                >
                  <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <div className="font-medium">Buy Credits</div>
                  <div className="text-sm text-purple-200">Purchase gaming credits</div>
                </Button>
                
                <Button
                  onClick={() => setShowRedeemModal(true)}
                  className="bg-accent hover:bg-accent/80 text-white rounded-lg p-4 h-auto flex-col space-y-2 transition-colors group"
                >
                  <ArrowRightLeft className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <div className="font-medium">Redeem Credits</div>
                  <div className="text-sm text-green-100">Convert to cash</div>
                </Button>
                
                <Button
                  onClick={handleGameSiteAccess}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 h-auto flex-col space-y-2 transition-colors group"
                >
                  <Gamepad2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <div className="font-medium">Play Game</div>
                  <div className="text-sm text-blue-100">Launch Golden Dragon City</div>
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
        }}
      />
      <RedeemModal 
        isOpen={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)}
        userCredits={credits}
      />
      {latestPurchase && (
        <PurchaseTrackerModal
          isOpen={showTracker}
          onClose={() => setShowTracker(false)}
          purchaseId={latestPurchase.id}
          creditsRequested={latestPurchase.creditsRequested}
          usdAmount={latestPurchase.usdAmount}
        />
      )}
    </div>
  );
}
