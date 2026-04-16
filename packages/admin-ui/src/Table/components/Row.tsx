import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const rowVariants = cva(
    "border-neutral-dimmed border-solid border-b-sm transition-colors hover:bg-neutral-subtle",
    {
        variants: {
            selected: {
                true: "bg-neutral-light"
            }
        }
    }
);

interface RowProps
    extends React.HTMLAttributes<HTMLTableRowElement>, VariantProps<typeof rowVariants> {}

const Row = ({ className, selected, ...props }: RowProps) => (
    <tr className={cn(rowVariants({ selected }), className)} {...props} />
);

export { Row, type RowProps };
