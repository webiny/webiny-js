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

const ACCORDION_ITEM_CLASSES = [
    "wby-group-item data-[state=open]:wby-rounded-bl-lg data-[state=open]:wby-rounded-br-lg",
    "group-[.wby-accordion-variant-container]/accordion:wby-rounded-lg",
    "data-[disabled]:wby-pointer-events-none data-[disabled]:wby-opacity-50"
] as const;

const splitAccordionProps = (props: AccordionItemProps) => {
    const {
        // AccordionRoot props
        className,
        defaultOpen,
        disabled,
        onOpenChange,
        open,
        // AccordionContent props
        children,
        icon,
        handle,
        // AccordionTrigger props
        ...triggerProps
    } = props;

    return {
        itemProps: { className, defaultOpen, disabled, onOpenChange, open },
        contentProps: { children, withIcon: !!icon, withHandle: !!handle },
        triggerProps
    };
};

const AccordionItemBase = (props: AccordionItemProps) => {
    const { itemProps, triggerProps, contentProps } = React.useMemo(
        () => splitAccordionProps(props),
        [props]
    );

    return (
        <AccordionRoot {...itemProps} className={cn(ACCORDION_ITEM_CLASSES, itemProps.className)}>
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
