import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  ExclamationTriangleIcon,
  CheckCircledIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm flex items-start gap-3 [&>svg]:shrink-0 [&>svg]:h-5 [&>svg]:w-5",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "bg-destructive/10 border-destructive/30 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-900/30 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
        warning:
          "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400",
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ComponentType<{ className?: string }>;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon: Icon, children, ...props }, ref) => {
    const iconMap = {
      default: InfoCircledIcon,
      destructive: ExclamationTriangleIcon,
      success: CheckCircledIcon,
      warning: ExclamationTriangleIcon,
      info: InfoCircledIcon,
    };

    const IconComponent =
      Icon || (variant && iconMap[variant as keyof typeof iconMap]);

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {IconComponent && <IconComponent className="mt-0.5" />}
        <div className="w-full">{children}</div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
