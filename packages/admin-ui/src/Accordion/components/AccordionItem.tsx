import * as React from "react";
import { cn, makeDecoratable, withStaticProps } from "~/utils.js";
import { AccordionTrigger } from "./AccordionTrigger.js";
import { AccordionContent } from "./AccordionContent.js";
import { AccordionItemIcon } from "./AccordionItemIcon.js";
import { AccordionItemAction } from "./AccordionItemAction.js";
import { AccordionRoot, type AccordionRootProps } from "~/Accordion/components/AccordionRoot.js";

interface AccordionItemProps extends Omit<AccordionRootProps, "title"> {
    title: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    handle?: React.ReactNode;
    interactive?: boolean;
    draggable?: boolean;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

const AccordionItemBase = (props: AccordionItemProps) => {
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
                ...triggerProps
            },
            contentProps: { children, withIcon: !!props.icon, withHandle: !!props.handle }
        };
    }, [props]);

    return (
        <AccordionRoot
            {...itemProps}
            className={cn(
                [
                    "group-item border-b-sm border-b-neutral-dimmed data-[state=open]:rounded-bl-lg data-[state=open]:rounded-br-lg",
                    "group-[.accordion-variant-container]:rounded-lg",
                    "group-[.accordion-background-base]:bg-neutral-base",
                    "group-[.accordion-background-light]:bg-neutral-light",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                ],
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
