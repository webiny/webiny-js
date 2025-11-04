import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cva, type VariantProps, cn } from "~/utils.js";

const accordionContentVariants = cva(
    [
        "overflow-hidden text-md pl-xxl pr-xxl",
        "transition-all",
        "data-[state=closed]:animate-collapsible-up",
        "data-[state=open]:animate-collapsible-down"
    ],
    {
        variants: {
            withIcon: {
                true: "pl-9"
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
        <div className="pt-sm pb-lg px-md">{children}</div>
    </CollapsiblePrimitive.Content>
);
