import * as React from "react";
import { cn } from "~/utils.js";

const Caption = ({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) => (
    <caption className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
);

export { Caption };
