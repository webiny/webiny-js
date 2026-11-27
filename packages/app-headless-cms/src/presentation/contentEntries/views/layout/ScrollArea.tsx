import React from "react";
import { cn } from "@webiny/admin-ui";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Matches `Container`: full screen uses the main content height, in layout fills the rest of the container. */
    fullScreen?: boolean;
}

export const ScrollArea = ({
    children,
    className,
    fullScreen = true,
    ...props
}: ScrollAreaProps) => {
    let heightClass = "flex-1 min-h-0";
    if (fullScreen) {
        heightClass = "h-main-content";
    }

    return (
        <div className={cn("overflow-y-auto", heightClass, className)} {...props}>
            {children}
        </div>
    );
};
