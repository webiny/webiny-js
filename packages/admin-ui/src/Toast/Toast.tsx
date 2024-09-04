import * as React from "react";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { ReactComponent as NotificationsIcon } from "@material-design-icons/svg/outlined/notifications_active.svg";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/utils";
import { Heading } from "~/Heading";
import { Text } from "~/Text";
import { Button } from "~/Button";

const ToastProvider = ToastPrimitives.Provider;

/**
 * Toast Viewport
 */
const ToastViewportBase = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            "fixed top-0 z-[100] flex max-h-screen flex-col-reverse p-4 sm:top-0 sm:right-0 sm:bottom-auto sm:flex-col",
            className
        )}
        {...props}
    />
));
ToastViewportBase.displayName = ToastPrimitives.Viewport.displayName;

const ToastViewport = makeDecoratable("ToastViewport", ToastViewportBase);

/**
 * Toast Root
 */
const toastVariants = cva(
    "group pointer-events-auto relative flex w-full items-start justify-start p-4 gap-3 self-stretch overflow-hidden rounded-md border shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
    {
        variants: {
            variant: {
                default: "border bg-background text-foreground",
                accent: "accent group bg-foreground text-background"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

const ToastRootBase = React.forwardRef<
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
ToastRootBase.displayName = ToastPrimitives.Root.displayName;

const ToastRoot = makeDecoratable("ToastRoot", ToastRootBase);

/**
 * Toast Action
 */
type ToastActionProps = ToastPrimitives.ToastActionProps & {
    text: React.ReactNode;
};

const ToastActionBase = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    ToastActionProps
>(({ onClick, text, ...props }, ref) => (
    <ToastPrimitives.ToastAction asChild {...props}>
        <Button ref={ref} onClick={onClick} text={text} variant={"primary"} size={"sm"} />
    </ToastPrimitives.ToastAction>
));
ToastActionBase.displayName = ToastPrimitives.Action.displayName;

const ToastAction = makeDecoratable("ToastAction", ToastActionBase);

/**
 * Toast Close Icon
 */
const ToastCloseBase = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            "rounded-md p-1 text-foreground/50 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.accent]:text-background group-[.accent]:fill-background",
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
ToastCloseBase.displayName = ToastPrimitives.Close.displayName;

const ToastClose = makeDecoratable("ToastClose", ToastCloseBase);

/**
 * Toast Icon
 */
type ToastIconProps = {
    icon?: React.ReactNode;
};

const ToastIconBase = ({ icon = <NotificationsIcon /> }: ToastIconProps) => (
    <div className={"fill-primary"}>{icon}</div>
);

const ToastIcon = makeDecoratable("ToastIcon", ToastIconBase);

/**
 * Toast Title
 */
type ToastTitleProps = Omit<ToastPrimitives.ToastTitleProps, "children"> & {
    text: React.ReactNode;
};

const ToastTitleBase = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    ToastTitleProps
>(({ text, ...props }, ref) => (
    <ToastPrimitives.Title ref={ref} asChild {...props}>
        <Heading level={6} text={text} />
    </ToastPrimitives.Title>
));
ToastTitleBase.displayName = ToastPrimitives.Title.displayName;

const ToastTitle = makeDecoratable("ToastTitle", ToastTitleBase);

/**
 * Toast Description
 */
type ToastDescriptionProps = Omit<ToastPrimitives.ToastDescriptionProps, "children"> & {
    text: React.ReactNode;
};

const ToastDescriptionBase = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    ToastDescriptionProps
>(({ text, ...props }, ref) => (
    <ToastPrimitives.Description ref={ref} asChild {...props}>
        <Text text={text} as={"div"} />
    </ToastPrimitives.Description>
));
ToastDescriptionBase.displayName = ToastPrimitives.Description.displayName;

const ToastDescription = makeDecoratable("ToastDescription", ToastDescriptionBase);

/**
 * Toast
 */
type ToastRootProps = React.ComponentPropsWithoutRef<typeof ToastRoot>;

interface ToastProps extends Omit<ToastRootProps, "title" | "content" | "children"> {
    title: React.ReactElement<ToastTitleProps>;
    description?: React.ReactElement<ToastDescriptionProps>;
    icon?: React.ReactNode;
    actions?: React.ReactElement<ToastActionProps> | React.ReactElement<ToastActionProps>[];
}

const ToastBase = ({ title, description, icon, actions, ...props }: ToastProps) => {
    return (
        <ToastRoot {...props}>
            <ToastIcon icon={icon} />
            <div className="w-64">
                {title}
                {description && description}
                {actions && actions}
            </div>
            <ToastClose />
        </ToastRoot>
    );
};

const Toast = makeDecoratable("Toast", ToastBase);

export {
    type ToastRootProps,
    type ToastActionProps,
    type ToastProps,
    Toast,
    ToastAction,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport
};
