import * as React from "react";
import { cn } from "~/utils.js";

export type CardDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

export const CardDescription = ({ className, ...props }: CardDescriptionProps) => (
    <div
        {...props}
        className={cn("wby-text-sm wby-text-neutral-strong wby-text-left", className)}
    />
);
