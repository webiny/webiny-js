import React from "react";
import { cn, cva, type VariantProps, makeDecoratable, withStaticProps } from "~/utils";
import { ItemCollapseTrigger } from "./ItemCollapseTrigger";
import { ItemContent } from "./ItemContent";
import { ItemDragHandle } from "./ItemDragHandle";
import { ItemIcon } from "./ItemIcon";
import { ItemSubIndentation } from "./ItemSubIndentation";

const itemVariants = cva(
    [
        "wby-group",
        "wby-relative",
        "wby-flex wby-items-center wby-gap-xs",
        "wby-px-sm wby-py-xs-plus wby-rounded-md",
        "wby-text-neutral-primary",
        "wby-cursor-pointer",
        "hover:wby-bg-neutral-dark/5"
    ],
    {
        variants: {
            active: {
                true: "wby-bg-neutral-dark/5 wby-font-semibold"
            }
        }
    }
);

type ItemProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof itemVariants>;

const BaseItem = ({ children, className, active, ...props }: ItemProps) => {
    return (
        <div className={"wby-mb-xs wby-px-xs-plus"}>
            <div {...props} className={cn(itemVariants({ active }), className)}>
                {children}
            </div>
        </div>
    );
};

const DecoratableItem = makeDecoratable("TreeItem", BaseItem);

const Item = withStaticProps(DecoratableItem, {
    CollapseTrigger: ItemCollapseTrigger,
    Content: ItemContent,
    DragHandle: ItemDragHandle,
    Icon: ItemIcon,
    SubIndentation: ItemSubIndentation
});

export { Item, type ItemProps };
