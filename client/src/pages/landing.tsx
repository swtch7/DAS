import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Shield, CreditCard, Smartphone } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100">
      {/* Header */}
      <nav className="bg-surface border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Gamepad2 className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold text-white">DAS Gaming Wallet</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/80">
              Sign In with Google
            </Button>
            <Link href="/login">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Your Gaming <span className="text-primary">Wallet Hub</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Seamlessly manage your gaming credits, track your USD value, and access Golden Dragon City with secure authentication and instant notifications.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary hover:bg-primary/80 text-white font-semibold px-8 py-3"
          >
            Get Started Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-surface border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-primary text-xl" />
              </div>
              <CardTitle className="text-white">Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Google OAuth integration with automatic game credential generation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="text-accent text-xl" />
              </div>
              <CardTitle className="text-white">Credit Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Buy and redeem credits with real-time USD conversion tracking
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Gamepad2 className="text-blue-500 text-xl" />
              </div>
              <CardTitle className="text-white">Game Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Direct access to Golden Dragon City with seamless credential transfer
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-gray-700">
            <CardHeader>
              <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="text-warning text-xl" />
              </div>
              <CardTitle className="text-white">SMS Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Instant notifications for transactions and payment links
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-8 mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Start Gaming?
          </h3>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Join thousands of players managing their gaming credits with DAS Wallet. 
            Secure, fast, and integrated with your favorite games.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
