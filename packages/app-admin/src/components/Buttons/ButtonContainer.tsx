import React from "react";
import { cn } from "@webiny/admin-ui";

export const ButtonContainer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return <div className={cn("ml-md text-nowrap empty:hidden", className)} {...props} />;
};
