import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Gamepad2, 
  Home, 
  User, 
  History, 
  LogOut,
  Plus,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  TrendingUp
} from "lucide-react";

interface Transaction {
  id: number;
  userId: string;
  type: string;
  amount: number;
  usdValue: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function Transactions() {
  const { user } = useAuth();

  // Fetch user transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Ensure transactions is always an array
  const transactions: Transaction[] = Array.isArray(transactionsData) ? transactionsData : [];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Plus className="h-5 w-5 text-green-500" />;
      case 'redemption':
        return <ArrowRightLeft className="h-5 w-5 text-orange-500" />;
      default:
        return <DollarSign className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'purchase') return 'text-green-500';
    if (type === 'redemption') return 'text-orange-500';
    return amount > 0 ? 'text-green-500' : 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const creditPurchases = transactions.filter(t => t.type === 'purchase').length;
  const redemptions = transactions.filter(t => t.type === 'redemption').length;
  const totalUsdValue = transactions.reduce((sum, t) => sum + parseFloat(t.usdValue || '0'), 0);

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
                <a className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors">
                  <User className="h-5 w-5" />
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
                <a className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors bg-zinc-700/30 text-white">
                  <History className="h-5 w-5" />
                  <span>Transaction History</span>
                </a>
              </Link>
              
              <button
                onClick={() => window.location.href = "/api/logout"}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-zinc-700/50 hover:text-white transition-colors text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Transaction History</h1>
            <p className="text-gray-400 text-lg">
              View all your credit purchases, redemptions, and game transactions
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {creditPurchases}
                    </p>
                    <p className="text-sm text-gray-400">Credit Purchases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {redemptions}
                    </p>
                    <p className="text-sm text-gray-400">Redemptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      ${totalUsdValue.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">Total USD Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                All Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Your transaction history will appear here once you make your first purchase or redemption.
                  </p>
                  <Link href="/">
                    <a className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-medium rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-colors">
                      <Plus className="h-4 w-4 mr-2" />
                      Buy Credits
                    </a>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg border border-zinc-600/30 hover:border-zinc-500/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-zinc-600/50 rounded-lg flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {transaction.type === 'purchase' ? 'Credit Purchase' :
                             transaction.type === 'redemption' ? 'Credit Redemption' :
                             transaction.description || 'Transaction'}
                          </h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <p className="text-sm text-gray-400">
                              {transaction.description}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-semibold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} credits
                          </p>
                          {transaction.usdValue && (
                            <p className="text-sm text-gray-400">
                              ${parseFloat(transaction.usdValue).toFixed(2)} USD
                            </p>
                          )}
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}