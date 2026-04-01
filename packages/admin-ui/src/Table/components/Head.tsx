import * as React from "react";
import { cn } from "~/utils.js";

export interface HeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    truncate?: boolean;
}

const Head = ({ className, children, truncate = true, ...props }: HeadProps) => (
    <th
        className={cn(
            [
                "box-border relative px-md py-sm text-sm text-left align-middle font-normal text-neutral-strong fill-neutral-xstrong",
                "hover:bg-neutral-subtle",
                "overflow-hidden whitespace-nowrap",
                "[&:has([role=checkbox])]:pl-lg",
                "leading-none"
            ],
            { truncate },
            className
        )}
        {...props}
    >
        {children}
    </th>
);

export { Head };
