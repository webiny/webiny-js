import React from "react";
import { cn, cva, type VariantProps, makeDecoratable, withStaticProps } from "~/utils.js";
import { ItemCollapseTrigger } from "./ItemCollapseTrigger.js";
import { ItemContent } from "./ItemContent.js";
import { ItemDragHandle } from "./ItemDragHandle.js";
import { ItemIcon } from "./ItemIcon.js";
import { ItemSubIndentation } from "./ItemSubIndentation.js";
import { ItemPlaceholder } from "./ItemPlaceholder.js";

const itemVariants = cva(
    [
        "group",
        "relative",
        "flex items-center justify-start gap-xs",
        "px-sm-plus py-xs-plus rounded-md",
        "text-neutral-primary",
        "cursor-pointer",
        "hover:bg-neutral-dark/5"
    ],
    {
        variants: {
            active: {
                true: "bg-neutral-dark/5 font-semibold"
            },
            loading: {
                true: "!text-neutral-disabled !fill-neutral-disabled !pointer-events-none"
            }
        }
    }
);

type ItemProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof itemVariants>;

const BaseItem = ({ children, className, active, loading, ...props }: ItemProps) => {
    return (
        <div className={"mb-xs px-sm"}>
            <div {...props} className={cn(itemVariants({ active, loading }), className)}>
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
    SubIndentation: ItemSubIndentation,
    Placeholder: ItemPlaceholder
});

export { Item, type ItemProps };
