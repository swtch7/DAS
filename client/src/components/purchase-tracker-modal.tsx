import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PurchaseTracker from "./purchase-tracker";
import { X } from "lucide-react";

interface PurchaseTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: number;
  creditsRequested: number;
  usdAmount: string;
}

export default function PurchaseTrackerModal({ 
  isOpen, 
  onClose, 
  purchaseId, 
  creditsRequested, 
  usdAmount 
}: PurchaseTrackerModalProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = () => {
    setIsCompleted(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              Credit Purchase Tracking
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Purchase Details */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <h3 className="text-white font-medium mb-2">Purchase Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-400">Credits:</span>
                <span className="text-white ml-2 font-medium">{creditsRequested.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-400">Amount:</span>
                <span className="text-white ml-2 font-medium">${usdAmount}</span>
              </div>
              <div>
                <span className="text-zinc-400">Purchase ID:</span>
                <span className="text-white ml-2 font-mono">#{purchaseId}</span>
              </div>
              <div>
                <span className="text-zinc-400">Status:</span>
                <span className="text-yellow-400 ml-2 font-medium">In Progress</span>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <PurchaseTracker 
            purchaseId={purchaseId} 
            onComplete={handleComplete}
          />

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <p className="text-zinc-400 text-sm">
              You can safely close this window. We'll update your account automatically.
            </p>
            <div className="flex gap-2">
              {isCompleted && (
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Refresh Dashboard
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-zinc-600 text-white hover:bg-zinc-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}