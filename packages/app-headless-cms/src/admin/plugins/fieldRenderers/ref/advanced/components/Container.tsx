import React from "react";
import { cn } from "@webiny/admin-ui";

type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

const Container = ({ children, className, ...props }: ContainerProps) => {
    return (
        <div
            {...props}
            className={cn(
                "w-full rounded-md border-sm border-neutral-muted p-sm-extra mt-xs relative",
                className
            )}
        >
            {children}
        </div>
    );
};

export { Container, type ContainerProps };
