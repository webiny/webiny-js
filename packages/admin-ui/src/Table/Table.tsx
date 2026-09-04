import * as React from "react";
import { cn, cva, type VariantProps, withStaticProps } from "~/utils.js";
import {
    Body,
    Caption,
    Cell,
    Direction,
    Footer,
    Head,
    Header,
    Resizer,
    Row
} from "~/Table/components/index.js";

const tableWrapperVariants = cva("relative w-full overflow-auto", {
    variants: {
        sticky: {
            true: "overflow-clip"
        }
    }
});

const tableVariants = cva("w-full caption-bottom text-sm bg-neutral-base", {
    variants: {
        bordered: {
            true: "border-neutral-dimmed border-solid border-sm"
        }
    }
});

interface TableProps
    extends React.HTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {
    sticky?: boolean;
}

const BaseTable = ({ className, bordered, sticky, ...props }: TableProps) => (
    <div className={cn(tableWrapperVariants({ sticky }))}>
        <table className={cn(tableVariants({ bordered }), className)} {...props} />
    </div>
);

const Table = withStaticProps(BaseTable, {
    Body,
    Caption,
    Cell,
    Direction,
    Footer,
    Head,
    Header,
    Resizer,
    Row
});

export { Table, type TableProps };
