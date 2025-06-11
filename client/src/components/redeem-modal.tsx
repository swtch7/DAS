import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCredits: number;
}

export default function RedeemModal({ isOpen, onClose, userCredits }: RedeemModalProps) {
  const [creditsToRedeem, setCreditsToRedeem] = useState<string>("");
  const [cashAppUsername, setCashAppUsername] = useState<string>("");
  const { toast } = useToast();

  const redeemMutation = useMutation({
    mutationFn: async (data: { creditsToRedeem: number; description: string }) => {
      await apiRequest("POST", "/api/redeem-credits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Redemption request submitted!",
        description: "Your request will be processed within 24 hours.",
      });
      onClose();
      setCreditsToRedeem("");
      setCashAppUsername("");
    },
    onError: (error) => {
      toast({
        title: "Redemption failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const credits = parseInt(creditsToRedeem);
    if (!credits || credits <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid credit amount.",
        variant: "destructive",
      });
      return;
    }

    if (credits > userCredits) {
      toast({
        title: "Insufficient credits",
        description: "You don't have enough credits to redeem this amount.",
        variant: "destructive",
      });
      return;
    }

    if (!cashAppUsername.trim()) {
      toast({
        title: "CashApp username required",
        description: "Please enter your CashApp username.",
        variant: "destructive",
      });
      return;
    }

    redeemMutation.mutate({
      creditsToRedeem: credits,
      description: `CashApp redemption for $${cashAppUsername.trim()}`,
    });
  };

  const credits = parseInt(creditsToRedeem) || 0;
  const usdValue = credits * 0.01;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-gray-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Redeem Credits</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Redeem Amount</Label>
            <Input
              type="number"
              value={creditsToRedeem}
              onChange={(e) => setCreditsToRedeem(e.target.value)}
              placeholder="Enter credits to redeem"
              min="1"
              max={userCredits}
              className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="text-sm text-gray-400">
              Available: {userCredits.toLocaleString()} credits
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300">CashApp Username</Label>
            <Input
              type="text"
              value={cashAppUsername}
              onChange={(e) => setCashAppUsername(e.target.value)}
              placeholder="$YourCashAppUsername"
              className="bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Credits to Redeem:</span>
              <span className="text-white">{credits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t border-gray-600">
              <span className="text-gray-300">USD Value:</span>
              <span className="text-accent">${usdValue.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/80 text-white font-medium py-3"
            disabled={redeemMutation.isPending || !creditsToRedeem || !cashAppUsername}
          >
            {redeemMutation.isPending ? "Processing..." : "Submit Redemption Request"}
          </Button>
          
          <div className="text-xs text-gray-400 text-center">
            Redemption requests are processed within 24 hours
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
