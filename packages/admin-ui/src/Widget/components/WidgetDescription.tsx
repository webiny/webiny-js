import * as React from "react";
import { cn } from "~/utils.js";

export type WidgetDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

export const WidgetDescription = ({ className, ...props }: WidgetDescriptionProps) => (
    <div {...props} className={cn("text-sm text-neutral-strong text-left", className)} />
);

