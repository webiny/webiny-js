import React from "react";
import { cn } from "@webiny/admin-ui";

interface OverlayContentProps extends React.HTMLAttributes<HTMLDivElement> {
    visible?: boolean;
}

const OverlayContent = ({ visible, className, style, children, ...props }: OverlayContentProps) => {
    return (
        <div
            data-state={visible ? "open" : "closed"}
            className={cn(
                [
                    "fixed inset-x-0 top-lg",
                    "w-screen",
                    "rounded-t-lg overflow-hidden",
                    "bg-neutral-base",
                    "transition ease-in-out",
                    "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:fade-in data-[state=open]:duration-500",
                    "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-150"
                ],
                className
            )}
            style={{ ...style, height: "calc(100vh - 24px)" }}
            {...props}
        >
            {children}
        </div>
    );
};

export { OverlayContent, type OverlayContentProps };
