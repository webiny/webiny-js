import * as React from "react";
import { cn } from "~/utils.js";

export type CardDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

export const CardDescription = ({ className, ...props }: CardDescriptionProps) => (
    <div {...props} className={cn("text-sm text-neutral-strong text-left", className)} />
);
