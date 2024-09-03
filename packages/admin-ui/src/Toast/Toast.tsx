import * as React from "react";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as NotificationsIcon } from "@material-design-icons/svg/outlined/notifications_active.svg";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/utils";
import { Heading } from "~/Heading";
import { Text } from "~/Text";

const ToastProvider = ToastPrimitives.Provider;

/**
 * Toast Viewport
 */
const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            "fixed top-0 z-[100] flex max-h-screen flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col",
            className
        )}
        {...props}
    />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/**
 * Toast Root
 */
const toastVariants = cva(
    "group pointer-events-auto relative flex w-full items-start justify-start p-4 gap-3 self-stretch overflow-hidden rounded-md border shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    {
        variants: {
            variant: {
                default: "border bg-background text-foreground",
                destructive:
                    "destructive group border-destructive bg-destructive text-destructive-foreground"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

const ToastRoot = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({ variant }), className)}
            {...props}
        />
    );
});
ToastRoot.displayName = ToastPrimitives.Root.displayName;

/**
 * Toast Action
 */
const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
            className
        )}
        {...props}
    />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

/**
 * Toast Close Icon
 */
const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            "rounded-md p-1 text-foreground/50 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
            className
        )}
        aria-label="Close"
        {...props}
    >
        <span className="h-4 w-4" aria-hidden>
            <CloseIcon />
        </span>
    </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

/**
 * Toast Icon
 */
const ToastIcon = () => (
    <div className={"fill-primary"}>
        <NotificationsIcon />
    </div>
);

/**
 * Toast Content
 */
type ToastContentProp = React.HTMLAttributes<HTMLElement>;

const ToastContent = ({ children }: ToastContentProp) => <div className={"w-64"}>{children}</div>;

/**
 * Toast Title
 */
type ToastTitleProps = Omit<ToastPrimitives.ToastTitleProps, "children"> & {
    text: React.ReactNode;
};

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    ToastTitleProps
>(({ text, ...props }, ref) => (
    <ToastPrimitives.Title ref={ref} asChild {...props}>
        <Heading level={6} text={text} />
    </ToastPrimitives.Title>
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

/**
 * Toast Description
 */
type ToastDescriptionProps = Omit<ToastPrimitives.ToastDescriptionProps, "children"> & {
    text: React.ReactNode;
};

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    ToastDescriptionProps
>(({ text, ...props }, ref) => (
    <ToastPrimitives.Description ref={ref} asChild {...props}>
        <Text text={text} as={"div"} />
    </ToastPrimitives.Description>
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

/**
 * Toast
 */
type ToastRootProps = React.ComponentPropsWithoutRef<typeof ToastRoot>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

interface ToastProps extends Omit<ToastRootProps, "title" | "content" | "children"> {
    title: React.ReactElement<ToastTitleProps>;
    description?: React.ReactElement<ToastDescriptionProps>;
    actions?: ToastActionElement[];
}

export const Toast = ({ title, description, actions, ...props }: ToastProps) => {
    return (
        <ToastRoot open={true} {...props}>
            <ToastIcon />
            <ToastContent>
                {title}
                {description && description}
                {actions && actions}
            </ToastContent>
            <ToastClose />
        </ToastRoot>
    );
};

export {
    type ToastRootProps,
    type ToastActionElement,
    type ToastProps,
    ToastProvider,
    ToastViewport,
    ToastRoot,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction
};
