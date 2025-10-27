import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cva, type VariantProps, cn } from "~/utils.js";

const accordionContentVariants = cva(
    [
        "wby-overflow-hidden wby-text-md wby-pl-xxl wby-pr-xxl",
        "wby-transition-all",
        "data-[state=closed]:wby-animate-collapsible-up",
        "data-[state=open]:wby-animate-collapsible-down"
    ],
    {
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

export const AccordionContent = ({
    children,
    withIcon,
    withHandle,
    className,
    ...props
}: AccordionContentProps) => (
    <CollapsiblePrimitive.Content
        {...props}
        className={cn(accordionContentVariants({ withHandle, withIcon }), className)}
    >
        <div className="wby-pt-sm wby-pb-lg wby-px-md">{children}</div>
    </CollapsiblePrimitive.Content>
);
