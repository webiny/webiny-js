import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

const tabListVariants = cva("wby-w-full wby-inline-flex wby-items-center wby-justify-start", {
    variants: {
        size: {
            sm: "wby-gap-sm",
            md: "wby-gap-sm",
            lg: "wby-gap-sm-extra",
            xl: "wby-gap-md"
        },
        spacing: {
            xs: "wby-px-xs",
            sm: "wby-px-sm",
            md: "wby-px-md",
            lg: "wby-px-lg",
            xl: "wby-px-xl",
            xxl: "wby-px-xxl"
        },
        separator: {
            true: "wby-border-solid wby-border-b-sm wby-border-neutral-dimmed"
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
