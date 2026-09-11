import React from "react";
import { cn, Heading, Text } from "@webiny/admin-ui";

interface PermissionsGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    title?: React.ReactNode;
    description?: React.ReactNode;
}

const PermissionsGroup = ({
    className,
    children,
    title,
    description,
    ...props
}: PermissionsGroupProps) => {
    return (
        <div
            {...props}
            className={cn("mb-lg p-md-extra border-sm border-neutral-dimmed rounded-lg", className)}
        >
            <Heading level={6} className={description ? "mb-xs" : "mb-sm"}>
                {title}
            </Heading>
            {description && (
                <Text as={"div"} size={"sm"} className={"mb-sm text-neutral-strong"}>
                    {description}
                </Text>
            )}
            {children}
        </div>
    );
};

export { PermissionsGroup, type PermissionsGroupProps };
