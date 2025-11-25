import * as React from "react";
import { cn } from "~/utils.js";

export type WidgetTitleProps = React.HTMLAttributes<HTMLDivElement>;

export const WidgetTitle = ({ className, ...props }: WidgetTitleProps) => (
    <div
        {...props}
        className={cn(
            "flex items-center gap-sm text-neutral-primary font-semibold pt-xs text-h5",
            className
        )}
    />
);
