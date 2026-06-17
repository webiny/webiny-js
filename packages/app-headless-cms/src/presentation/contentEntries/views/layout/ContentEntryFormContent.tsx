import React from "react";
import { cn } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/react-composition";

export const ContentEntryFormContent = makeDecoratable(
    "Content",
    ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
        return (
            <div className={cn("flex justify-center pt-xl", className)} {...props}>
                {children}
            </div>
        );
    }
);
