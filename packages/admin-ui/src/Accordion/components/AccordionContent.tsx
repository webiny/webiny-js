import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cva, type VariantProps, cn } from "~/utils";

const accordionContentVariants = cva(
    [
        "wby-overflow-hidden wby-text-md",
        "wby-transition-all data-[state=closed]:wby-animate-collapsible-up data-[state=open]:wby-animate-collapsible-down"
    ],
    {
        // Using pixel values here because of non-existing design tokens.
        variants: {
            withIcon: {
                true: "wby-pl-9"
            },
            withHandle: {
                true: "wby-pl-5"
            }
        },
        compoundVariants: [
            {
                withIcon: true,
                withHandle: true,
                className: "wby-pl-14"
            }
        ],
        defaultVariants: {
            withIcon: false,
            withHandle: false
        }
    }
);

export interface AccordionContentProps
    extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>,
        VariantProps<typeof accordionContentVariants> {}

const AccordionContent = ({ children, withIcon, withHandle, ...props }: AccordionContentProps) => {
    return (
        <CollapsiblePrimitive.Content
            {...props}
            className={cn(accordionContentVariants({ withHandle, withIcon }), props.className)}
        >
            <div className={"wby-pt-sm wby-pb-lg wby-pl-md wby-pr-[52px]"}>{children}</div>
        </CollapsiblePrimitive.Content>
    );
};

export { AccordionContent };
