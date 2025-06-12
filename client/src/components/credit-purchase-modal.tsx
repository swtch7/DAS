import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSubmitted?: (purchase: { id: number; creditsRequested: number; usdAmount: string }) => void;
}

const predefinedAmounts = [
  { credits: 1000, usd: 10.00 },
  { credits: 2500, usd: 25.00 },
  { credits: 5000, usd: 50.00 },
  { credits: 10000, usd: 100.00 },
];

export default function CreditPurchaseModal({ isOpen, onClose, onPurchaseSubmitted }: CreditPurchaseModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customCredits, setCustomCredits] = useState<string>("");
  const { toast } = useToast();

  const purchaseMutation = useMutation({
    mutationFn: async (data: { creditsRequested: number; usdAmount: number }) => {
      await apiRequest("POST", "/api/credit-purchase", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Purchase request submitted!",
        description: "You'll receive an SMS with payment instructions within 5 minutes.",
      });
      onClose();
      setSelectedAmount("");
      setCustomCredits("");
    },
    onError: (error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCalculatedValues = () => {
    if (selectedAmount === "custom") {
      const credits = parseInt(customCredits) || 0;
      return { credits, usd: credits * 0.01 };
    }
    
    const predefined = predefinedAmounts.find(a => a.credits.toString() === selectedAmount);
    return predefined || { credits: 0, usd: 0 };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { credits, usd } = getCalculatedValues();
    
    if (credits <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please select a valid credit amount.",
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate({
      creditsRequested: credits,
      usdAmount: usd,
    });
  };

  const { credits, usd } = getCalculatedValues();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-gray-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Buy Gaming Credits</DialogTitle>
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
            <Label className="text-gray-300">Credit Amount</Label>
            <Select value={selectedAmount} onValueChange={setSelectedAmount}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select credit amount" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {predefinedAmounts.map((amount) => (
                  <SelectItem key={amount.credits} value={amount.credits.toString()}>
                    {amount.credits.toLocaleString()} Credits - ${amount.usd.toFixed(2)}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedAmount === "custom" && (
            <div className="space-y-2">
              <Label className="text-gray-300">Custom Credit Amount</Label>
              <Input
                type="number"
                value={customCredits}
                onChange={(e) => setCustomCredits(e.target.value)}
                placeholder="Enter credit amount"
                min="100"
                step="100"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          )}
          
          <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Credits:</span>
              <span className="text-white">{credits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Rate:</span>
              <span className="text-white">$0.01 per credit</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t border-gray-600">
              <span className="text-gray-300">Total:</span>
              <span className="text-accent">${usd.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-3"
            disabled={purchaseMutation.isPending || !selectedAmount}
          >
            {purchaseMutation.isPending ? "Processing..." : "Request Purchase Link"}
          </Button>
          
          <div className="text-xs text-gray-400 text-center">
            You'll receive an SMS with payment instructions within 5 minutes
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
