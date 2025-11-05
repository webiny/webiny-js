import * as React from "react";
import { cn } from "~/utils.js";

const Body = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={cn("[&_tr:last-child]:border-none", className)} {...props} />
);

export { Body };
