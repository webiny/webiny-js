import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const tabListVariants = cva("w-full inline-flex items-center justify-start", {
    variants: {
        size: {
            sm: "gap-sm",
            md: "gap-sm",
            lg: "gap-sm-extra",
            xl: "gap-md"
        },
        spacing: {
            xs: "px-xs",
            sm: "px-sm",
            md: "px-md",
            lg: "px-lg",
            xl: "px-xl",
            xxl: "px-xxl"
        },
        separator: {
            true: "border-solid border-b-sm border-neutral-dimmed"
        }
    },
    defaultVariants: {
        size: "sm"
    }
});

type ListProps = TabsPrimitive.TabsListProps & VariantProps<typeof tabListVariants>;

const List = ({ className, spacing, size, separator, ...props }: ListProps) => (
    <TabsPrimitive.List
        className={cn(tabListVariants({ spacing, size, separator }), className)}
        {...props}
    />
);

export { List, type ListProps, tabListVariants };
