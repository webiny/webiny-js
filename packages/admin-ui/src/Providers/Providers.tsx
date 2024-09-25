import React from "react";
import { ToastProvider, ToastViewport } from "~/Toast";
import { TooltipProvider } from "~/Tooltip";

export interface ProvidersProps {
    children?: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
    return (
        <ToastProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <ToastViewport />
        </ToastProvider>
    );
};
