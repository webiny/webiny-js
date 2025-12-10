import * as React from "react";
import { cva, cn, makeDecoratable, withStaticProps } from "~/utils.js";
import { AccordionTrigger } from "./AccordionTrigger.js";
import { AccordionContent } from "./AccordionContent.js";
import { AccordionItemIcon } from "./AccordionItemIcon.js";
import { AccordionItemAction } from "./AccordionItemAction.js";
import { AccordionRoot, type AccordionRootProps } from "~/Accordion/components/AccordionRoot.js";
import { useAccordionBackground } from "~/Accordion/components/AccordionBackgroundProvider";

interface AccordionItemProps extends Omit<AccordionRootProps, "title"> {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    description?: React.ReactNode;
    colorMark?: string;
    icon?: React.ReactNode;
    handle?: React.ReactNode;
    interactive?: boolean;
    locked?: boolean;
    draggable?: boolean;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

const accordionItemVariants = cva("", {
    variants: {
        locked: {
            true: "pointer-events-none"
        },
        background: {
            base: "bg-neutral-base",
            light: "bg-neutral-light",
            transparent: "bg-transparent"
        }
    }
});

// border-b-sm border-b-neutral-dimmed
const AccordionItemBase = (props: AccordionItemProps) => {
    const background = useAccordionBackground("light");

    const { itemProps, triggerProps, contentProps } = React.useMemo(() => {
        const {
            // Item props.
            className,
            defaultOpen,
            disabled,
            onOpenChange,
            open,

            // Content props.
            children,

            // Shared props.
            locked,

            // Trigger props.
            ...triggerProps
        } = props;

        return {
            itemProps: {
                className,
                defaultOpen,
                disabled,
                onOpenChange,
                open
            },
            triggerProps: {
                locked,
                ...triggerProps
            },
            contentProps: { children, withIcon: !!props.icon, withHandle: !!props.handle }
        };
    }, [props]);

    return (
        <AccordionRoot
            {...itemProps}
            className={cn(
                "group-item data-[state=open]:rounded-bl-lg data-[state=open]:rounded-br-lg",
                "group-[.accordion-variant-container]/accordion:rounded-lg",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                accordionItemVariants({ locked: props.locked, background }),
                itemProps.className
            )}
        >
            <AccordionTrigger {...triggerProps} />
            <AccordionContent {...contentProps} />
        </AccordionRoot>
    );
};

const DecoratableAccordionItem = makeDecoratable("AccordionItem", AccordionItemBase);

const AccordionItem = withStaticProps(DecoratableAccordionItem, {
    Icon: AccordionItemIcon,
    Action: AccordionItemAction
});

export { AccordionItem, type AccordionItemProps };
