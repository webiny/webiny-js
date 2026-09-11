import * as React from "react";
import { ReactComponent as Check } from "@webiny/icons/check.svg";
import { Command as CommandPrimitive } from "cmdk";
import { cn, cva, type VariantProps } from "~/utils.js";

const commandItemVariants = cva(
    [
        "flex items-center justify-between gap-sm-extra cursor-default select-none rounded-sm p-sm mx-sm text-md outline-none overflow-hidden",
        "bg-neutral-elevated text-neutral-primary fill-neutral-xstrong",
        "data-[disabled=true]:text-neutral-disabled data-[disabled=true]:cursor-not-allowed",
        "data-[selected=true]:bg-neutral-dimmed"
    ],
    {
        variants: {
            selected: {
                true: "font-semibold bg-neutral-dimmed"
            }
        }
    }
);

interface ItemProps
    extends
        React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>,
        VariantProps<typeof commandItemVariants> {
    selected?: boolean;
}

const Item = ({ className, children, selected, ...props }: ItemProps) => (
    <CommandPrimitive.Item className={cn(commandItemVariants({ selected }), className)} {...props}>
        <span className={"w-full overflow-hidden truncate whitespace-nowrap"}>{children}</span>
        {selected ? <Check className="w-md h-md" /> : null}
    </CommandPrimitive.Item>
);

export { Item, type ItemProps };
