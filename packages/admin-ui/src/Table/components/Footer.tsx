import * as React from "react";
import { cn } from "~/utils.js";

const Footer = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tfoot
        className={cn(
            "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
            className
        )}
        {...props}
    />
);

export { Footer };
