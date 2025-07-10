import React from "react";
import { cn, cva, type VariantProps } from "~/utils";

const columnSorterVariants = cva("wby-flex wby-items-center wby-gap-xxs wby-cursor-auto", {
    variants: {
        sortable: {
            true: "wby-cursor-pointer"
        }
    }
});

interface ColumnSorterProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof columnSorterVariants> {}

const ColumnSorter = ({ className, children, sortable, ...props }: ColumnSorterProps) => {
    return (
        <div {...props} className={cn(columnSorterVariants({ sortable }), className)}>
            {children}
        </div>
    );
};

export { ColumnSorter };
