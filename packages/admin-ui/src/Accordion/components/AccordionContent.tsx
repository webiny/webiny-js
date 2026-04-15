import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cva, cn } from "~/utils.js";
import { useAccordionItemProps } from "./AccordionItem.js";

const accordionContentVariants = cva(
    [
        "overflow-hidden text-md pr-xxl",
        "transition-all",
        "data-[state=closed]:animate-collapsible-up",
        "data-[state=open]:animate-collapsible-down"
    ],
    {
        variants: {
            withIcon: {
                true: "pl-xxl",
                false: "pl-md"
            },
            withHandle: {
                true: "pl-5"
            }
        },
        compoundVariants: [
            {
                withIcon: true,
                withHandle: true,
                className: "pl-14"
            }
        ],
        defaultVariants: {
            withIcon: false,
            withHandle: false
        }
    }
);

export interface AccordionContentProps extends React.ComponentPropsWithoutRef<
    typeof CollapsiblePrimitive.Content
> {}

export const AccordionContent = ({ children, className, ...props }: AccordionContentProps) => {
    const itemProps = useAccordionItemProps();
    const withIcon = !!itemProps.icon;
    const withHandle = !!itemProps.handle;

    return (
        <CollapsiblePrimitive.Content
            {...props}
            className={cn(accordionContentVariants({ withHandle, withIcon }), className)}
        >
            <div data-accordion={"content"} className="pt-sm pb-lg">
                {children}
            </div>
        </CollapsiblePrimitive.Content>
    );
};
