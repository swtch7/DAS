import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, CreditCard, DollarSign, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PurchaseTrackerSidebarProps {
  purchaseId: number;
  creditsRequested: number;
  usdAmount: string;
  onComplete?: () => void;
  onClose?: () => void;
}

type PurchaseStage = 'pending' | 'url_sent' | 'processing' | 'completed';

interface TrackerStage {
  id: PurchaseStage;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const stages: TrackerStage[] = [
  {
    id: 'pending',
    title: 'Purchase Pending',
    description: 'Request submitted to admin',
    icon: Clock,
  },
  {
    id: 'url_sent',
    title: 'Pay Link Sent',
    description: 'Payment link generated',
    icon: DollarSign,
  },
  {
    id: 'processing',
    title: 'Processing Payment',
    description: 'Verifying completion',
    icon: CreditCard,
  },
  {
    id: 'completed',
    title: 'Credits Applied',
    description: 'Added to your account',
    icon: CheckCircle,
  },
];

export default function PurchaseTrackerSidebar({ 
  purchaseId, 
  creditsRequested, 
  usdAmount, 
  onComplete,
  onClose 
}: PurchaseTrackerSidebarProps) {
  const [currentStage, setCurrentStage] = useState<PurchaseStage>('pending');
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling) return;

    const pollPurchaseStatus = async () => {
      try {
        const response = await fetch(`/api/credit-purchase/${purchaseId}/status`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const newStage = determineStage(data);
          
          if (newStage !== currentStage) {
            setCurrentStage(newStage);
            
            if (newStage === 'completed') {
              setIsPolling(false);
              onComplete?.();
            }
          }
        }
      } catch (error) {
        console.error('Error polling purchase status:', error);
      }
    };

    const interval = setInterval(pollPurchaseStatus, 3000);
    
    return () => clearInterval(interval);
  }, [purchaseId, currentStage, isPolling, onComplete]);

  const determineStage = (purchaseData: any): PurchaseStage => {
    if (purchaseData.status === 'completed') return 'completed';
    if (purchaseData.adminUrl && purchaseData.status === 'pending') return 'processing';
    if (purchaseData.adminUrl) return 'url_sent';
    return 'pending';
  };

  const getStageIndex = (stage: PurchaseStage): number => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentStageIndex = getStageIndex(currentStage);

  return (
    <div className="w-80 h-full bg-zinc-900 border-l border-zinc-700 flex flex-col">
      <Card className="bg-zinc-800 border-zinc-700 flex-1 rounded-none border-0 border-b border-zinc-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-400" />
              Purchase Progress
            </CardTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-zinc-400 hover:text-white h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 pb-6">
          {/* Purchase Details */}
          <div className="bg-zinc-700/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Credits:</span>
              <span className="text-white font-medium">{creditsRequested.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Amount:</span>
              <span className="text-white font-medium">${usdAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">ID:</span>
              <span className="text-white font-mono text-xs">#{purchaseId}</span>
            </div>
          </div>

          {/* Vertical Progress Bar */}
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-zinc-600">
              <div 
                className="w-full bg-gradient-to-b from-yellow-400 to-orange-500 transition-all duration-1000 ease-out"
                style={{ height: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
              />
            </div>
            
            <div className="space-y-8">
              {stages.map((stage, index) => {
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const Icon = stage.icon;
                
                return (
                  <div key={stage.id} className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 flex-shrink-0",
                        isCompleted
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                          : "bg-zinc-700 text-zinc-400",
                        isCurrent && "ring-4 ring-yellow-400/30 animate-pulse"
                      )}
                    >
                      {isCompleted && index < currentStageIndex ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium transition-colors duration-300",
                          isCompleted ? "text-yellow-400" : "text-zinc-400"
                        )}
                      >
                        {stage.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 leading-tight">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-zinc-700/50 rounded-lg p-3 border border-zinc-600">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm">
                  {stages[currentStageIndex].title}
                </h3>
                <p className="text-zinc-400 text-xs">
                  {currentStage === 'pending' && "Processing your request..."}
                  {currentStage === 'url_sent' && "Payment link ready"}
                  {currentStage === 'processing' && "Almost complete!"}
                  {currentStage === 'completed' && "🎉 Success!"}
                </p>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="text-center">
            <p className="text-zinc-400 text-xs">
              {currentStage === 'pending' && "Est. 2-5 minutes"}
              {currentStage === 'url_sent' && "Complete your payment"}
              {currentStage === 'processing' && "Finalizing..."}
              {currentStage === 'completed' && "Credits added successfully"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}