import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "./useUserDashboard";
import { AlertCircle } from "lucide-react";

interface ResetPasswordModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSendResetEmail: (userId: string, email: string) => Promise<void>;
  isProcessing: boolean;
}

export function ResetPasswordModal({
  user,
  isOpen,
  onClose,
  onSendResetEmail,
  isProcessing,
}: ResetPasswordModalProps) {
  const handleSubmit = async () => {
    if (!user) return;
    await onSendResetEmail(user.id, user.email);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Password Reset Email</DialogTitle>
          <DialogDescription className="pt-2 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              This will send a password reset email to{" "}
              <strong>{user.email}</strong>. The user will receive an email with
              a link to reset their password.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#004aad] hover:bg-[#004aad]/90 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? "Sending..." : "Send Reset Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
