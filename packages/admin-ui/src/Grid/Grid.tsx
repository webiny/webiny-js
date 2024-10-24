import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, withStaticProps } from "~/utils";

const columnVariants = cva("", {
    variants: {
        span: {
            auto: "col-auto",
            1: "col-span-1",
            2: "col-span-2",
            3: "col-span-3",
            4: "col-span-4",
            5: "col-span-5",
            6: "col-span-6",
            7: "col-span-7",
            8: "col-span-8",
            9: "col-span-9",
            10: "col-span-10",
            11: "col-span-11",
            12: "col-span-12"
        },
        align: {
            top: "self-start",
            middle: "self-center",
            bottom: "self-end"
        }
    },
    defaultVariants: {
        span: "auto"
    }
});

interface ColumnProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof columnVariants> {
    children: React.ReactNode;
}

const ColumnBase = React.forwardRef<HTMLDivElement, ColumnProps>(
    ({ span, align, children, className, ...props }, ref) => {
        return (
            <div {...props} className={cn(columnVariants({ span, align, className }))} ref={ref}>
                {children}
            </div>
        );
    }
);

ColumnBase.displayName = "Column";

const Column = makeDecoratable("Column", ColumnBase);

const gridVariants = cva("grid", {
    variants: {
        columns: {
            1: "grid-cols-1",
            2: "grid-cols-2",
            3: "grid-cols-3",
            4: "grid-cols-4",
            5: "grid-cols-5",
            6: "grid-cols-6",
            7: "grid-cols-7",
            8: "grid-cols-8",
            9: "grid-cols-9",
            10: "grid-cols-10",
            11: "grid-cols-11",
            12: "grid-cols-12"
        },
        gap: {
            1: "gap-1",
            2: "gap-2",
            3: "gap-3",
            4: "gap-4",
            5: "gap-5",
            6: "gap-6",
            7: "gap-7",
            8: "gap-8",
            9: "gap-9",
            10: "gap-10",
            11: "gap-11",
            12: "gap-12"
        }
    },
    defaultVariants: {
        columns: 12,
        gap: 4
    }
});

interface GridProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof gridVariants> {
    children:
        | React.ReactElement<ColumnProps, typeof Column>
        | Array<React.ReactElement<ColumnProps, typeof Column>>;
}

const GridBase = React.forwardRef<HTMLDivElement, GridProps>(
    ({ columns, gap, children, className, ...props }, ref) => {
        return (
            <div {...props} className={cn(gridVariants({ columns, gap, className }))} ref={ref}>
                {children}
            </div>
        );
    }
);

GridBase.displayName = "Grid";

const DecoratableGrid = makeDecoratable("Grid", GridBase);

const Grid = withStaticProps(DecoratableGrid, { Column });

export { Grid, type GridProps, type ColumnProps };
