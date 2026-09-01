import React from "react";
import { cn } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/react-composition";

interface ContentEntryFormContentProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string;
}

export const ContentEntryFormContent = makeDecoratable(
    "Content",
    ({ children, className, width, ...props }: ContentEntryFormContentProps) => {
        return (
            <div className={cn("flex justify-center pt-xl", className)} {...props}>
                <div className={"bg-neutral-base rounded-lg p-lg"} style={{ width }}>
                    {children}
                </div>
            </div>
        );
    }
);
