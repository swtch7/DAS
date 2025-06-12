import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, CreditCard, DollarSign, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PurchaseTrackerProps {
  purchaseId: number;
  onComplete?: () => void;
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
    description: 'Your credit purchase request has been submitted',
    icon: Clock,
  },
  {
    id: 'url_sent',
    title: 'Pay Link Sent',
    description: 'Payment link has been generated and sent to you',
    icon: DollarSign,
  },
  {
    id: 'processing',
    title: 'Processing Payment',
    description: 'Your payment is being verified and processed',
    icon: CreditCard,
  },
  {
    id: 'completed',
    title: 'Credits Applied',
    description: 'Credits have been added to your account successfully',
    icon: CheckCircle,
  },
];

export default function PurchaseTracker({ purchaseId, onComplete }: PurchaseTrackerProps) {
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

    const interval = setInterval(pollPurchaseStatus, 3000); // Poll every 3 seconds
    
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
    <Card className="bg-zinc-800 border-zinc-700 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Credit Purchase Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="relative">
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-zinc-600">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 ease-out"
              style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between relative">
            {stages.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const Icon = stage.icon;
              
              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative z-10",
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
                  
                  <div className="mt-3 text-center max-w-24">
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

        {/* Current Stage Details */}
        <div className="bg-zinc-700/50 rounded-lg p-4 border border-zinc-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-medium">
                {stages[currentStageIndex].title}
              </h3>
              <p className="text-zinc-400 text-sm">
                {stages[currentStageIndex].description}
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="text-center">
          <p className="text-zinc-400 text-sm">
            {currentStage === 'pending' && "Estimated time: 2-5 minutes"}
            {currentStage === 'url_sent' && "Please complete your payment"}
            {currentStage === 'processing' && "Verifying payment... Almost done!"}
            {currentStage === 'completed' && "🎉 Purchase complete! Credits added to your account"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}