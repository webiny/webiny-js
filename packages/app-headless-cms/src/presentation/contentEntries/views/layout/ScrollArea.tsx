import React from "react";
import { cn } from "@webiny/admin-ui";

export const ScrollArea = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("overflow-y-auto h-main-content", className)} {...props}>
            {children}
        </div>
    );
};
