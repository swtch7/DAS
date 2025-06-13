import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";

interface PhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneUpdated: () => void;
}

export default function PhoneNumberModal({ isOpen, onClose, onPhoneUpdated }: PhoneNumberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const updatePhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      return await apiRequest("PATCH", "/api/profile", { phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Phone number updated",
        description: "Your phone number has been successfully added.",
      });
      onPhoneUpdated();
      onClose();
      setPhoneNumber("");
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic phone number validation
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    updatePhoneMutation.mutate(phoneNumber);
  };

  const handleClose = () => {
    if (!updatePhoneMutation.isPending) {
      onClose();
      setPhoneNumber("");
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Phone className="h-5 w-5" />
            Phone Number Required
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            A phone number is required for credit purchases and redemptions for security purposes.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
              disabled={updatePhoneMutation.isPending}
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updatePhoneMutation.isPending}
              className="border-zinc-600 text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatePhoneMutation.isPending}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-medium hover:from-yellow-500 hover:to-orange-600"
            >
              {updatePhoneMutation.isPending ? "Updating..." : "Add Phone Number"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}