import * as React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import { ListItem, type ListItemProps } from "./components/index.js";

const listVariants = cva("group w-full", {
    variants: {
        variant: {
            container: "list-variant-container",
            underline: "list-variant-underline"
        },
        background: {
            base: "list-background-base",
            light: "list-background-light",
            transparent: "list-background-transparent"
        }
    },
    defaultVariants: {
        variant: "underline",
        background: "base"
    }
});

interface ListProps
    extends VariantProps<typeof listVariants>,
        Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    children: React.ReactNode;
}

const DecoratableList = ({ children, variant, background, className, ...props }: ListProps) => {
    return (
        <div {...props} className={cn(listVariants({ variant, background }), className)}>
            {children}
        </div>
    );
};

const List = withStaticProps(makeDecoratable("List", DecoratableList), {
    Item: ListItem
});

export { List, type ListProps, type ListItemProps };
