import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { User } from "./useUserDashboard";

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteUser: (userId: string) => Promise<void>;
  isProcessing: boolean;
}

export function DeleteUserModal({
  user,
  isOpen,
  onClose,
  onDeleteUser,
  isProcessing,
}: DeleteUserModalProps) {
  const handleDelete = async () => {
    if (!user) return;
    await onDeleteUser(user.id);
  };

  if (!user) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete User
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete user &quot;
              <span className="font-medium">{user.email}</span>
              &quot;?
            </p>
            <div className="bg-red-50 p-3 rounded-md text-red-600 border border-red-200 flex items-start mt-2">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>
                This action cannot be undone. The user will be permanently
                removed from both the database and authentication system. They
                will lose all access to the platform.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            disabled={isProcessing}
            className="hover:bg-gray-100 transition-colors"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={isProcessing}
          >
            {isProcessing ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
