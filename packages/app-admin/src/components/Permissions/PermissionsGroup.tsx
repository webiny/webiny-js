import React from "react";
import { cn, Heading } from "@webiny/admin-ui";

interface PermissionsGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title?: React.ReactNode;
}

const PermissionsGroup = ({ className, children, title, ...props }: PermissionsGroupProps) => {
    return (
        <div
            {...props}
            className={cn("mb-lg p-md-extra border-sm border-neutral-dimmed rounded-lg", className)}
        >
            <Heading level={6} className={"mb-sm"}>
                {title}
            </Heading>
            {children}
        </div>
    );
};

export { PermissionsGroup, type PermissionsGroupProps };
