import React from "react";
import { TooltipProvider } from "~/Tooltip";

export interface ProvidersProps {
    children?: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
    return <TooltipProvider>{children}</TooltipProvider>;
};
