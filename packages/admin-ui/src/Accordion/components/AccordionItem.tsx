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
    colorMark?: string;
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
                    "wby-group-item wby-border-b-sm wby-border-b-neutral-dimmed data-[state=open]:wby-rounded-bl-lg data-[state=open]:wby-rounded-br-lg",
                    "group-[.wby-accordion-variant-container]:wby-rounded-lg",
                    "group-[.wby-accordion-background-base]:wby-bg-neutral-base",
                    "group-[.wby-accordion-background-light]:wby-bg-neutral-light",
                    "data-[disabled]:wby-pointer-events-none data-[disabled]:wby-opacity-50"
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
