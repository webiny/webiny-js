import React from "react";
import { cn } from "@webiny/admin-ui";

export const Container = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={"[&_#cms-content-details-tabs>[role=tablist]]:hidden"}>
            <div
                className={cn(
                    ["bg-neutral-light", "fixed z-overlay top-0 left-0", "w-full h-screen"],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </div>
    );
};
