import React from "react";
import { cn, cva, withStaticProps, makeDecoratable, type VariantProps } from "~/utils";

const columnVariants = cva("", {
    variants: {
        span: {
            auto: "wby-col-auto",
            1: "wby-col-span-1",
            2: "wby-col-span-2",
            3: "wby-col-span-3",
            4: "wby-col-span-4",
            5: "wby-col-span-5",
            6: "wby-col-span-6",
            7: "wby-col-span-7",
            8: "wby-col-span-8",
            9: "wby-col-span-9",
            10: "wby-col-span-10",
            11: "wby-col-span-11",
            12: "wby-col-span-12"
        },
        offset: {
            1: "wby-col-start-2",
            2: "wby-col-start-3",
            3: "wby-col-start-4",
            4: "wby-col-start-5",
            5: "wby-col-start-6",
            6: "wby-col-start-7",
            7: "wby-col-start-8",
            8: "wby-col-start-9",
            9: "wby-col-start-10",
            10: "wby-col-start-11",
            11: "wby-col-start-12"
        },
        align: {
            top: "wby-self-start",
            middle: "wby-self-center",
            bottom: "wby-self-end"
        }
    },
    defaultVariants: {
        span: "auto"
    }
});

interface ColumnProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof columnVariants> {
    children?: React.ReactNode;
}

const ColumnBase = ({ span, align, children, className, offset, ...props }: ColumnProps) => {
    return (
        <div {...props} className={cn(columnVariants({ span, offset, align }), className)}>
            {children}
        </div>
    );
};

const Column = makeDecoratable("Column", ColumnBase);

const gridVariants = cva("wby-grid", {
    variants: {
        gap: {
            none: "wby-gap-0",
            micro: "wby-gap-xs",
            small: "wby-gap-sm",
            compact: "wby-gap-md",
            comfortable: "wby-gap-lg",
            spacious: "wby-gap-xl"
        }
    },
    defaultVariants: {
        gap: "comfortable"
    }
});

interface GridProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof gridVariants> {
    children:
        | React.ReactElement<ColumnProps, typeof Column>
        | Array<React.ReactElement<ColumnProps, typeof Column>>;
}

const GridBase = ({ gap, children, className, ...props }: GridProps) => {
    return (
        <div {...props} className={cn("wby-grid-cols-12", gridVariants({ gap }), className)}>
            {children}
        </div>
    );
};

const DecoratableGrid = makeDecoratable("Grid", GridBase);

const Grid = withStaticProps(DecoratableGrid, { Column });

export { Grid, type GridProps, type ColumnProps };
