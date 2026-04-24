import * as React from "react";
import { cn } from "~/utils.js";

export interface CellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    truncate?: boolean;
}

const Cell = ({ className, truncate = true, ...props }: CellProps) => (
    <td
        className={cn(
            [
                "box-border px-md py-sm-extra text-md text-left align-middle text-neutral-primary",
                "overflow-hidden whitespace-nowrap",
                "[&:has([role=checkbox])]:pl-lg",
                "leading-none"
            ],
            { truncate },
            className
        )}
        {...props}
    />
);

export { Cell };
