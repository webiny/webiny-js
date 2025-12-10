import * as React from "react";
import { cva, cn, makeDecoratable, withStaticProps } from "~/utils.js";
import { AccordionTrigger } from "./AccordionTrigger.js";
import { AccordionContent } from "./AccordionContent.js";
import { AccordionItemIcon } from "./AccordionItemIcon.js";
import { AccordionItemAction } from "./AccordionItemAction.js";
import { AccordionRoot, type AccordionRootProps } from "~/Accordion/components/AccordionRoot.js";
import { useAccordionBackground } from "~/Accordion/components/AccordionBackgroundProvider";
import {
    AccordionItemPropsProvider,
    useAccordionItemProps
} from "./AccordionItemPropsProvider.js";
import { useAccordionProps } from "../Accordion.js";

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
        },
        variant: {
            underline: "border-b-sm border-b-neutral-dimmed",
            container: ""
        }
    },
    defaultVariants: {
        variant: "underline"
    }
});

const AccordionItemBase = (props: AccordionItemProps) => {
    const accordionProps = useAccordionProps();
    const background = useAccordionBackground("light");

    const { className, defaultOpen, disabled, onOpenChange, open, children, locked } = props;

    return (
        <AccordionRoot
            className={cn(
                "group-item data-[state=open]:rounded-bl-lg data-[state=open]:rounded-br-lg",
                "group-[.accordion-variant-container]/accordion:rounded-lg",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                accordionItemVariants({ locked, background, variant: accordionProps.variant }),
                className
            )}
            defaultOpen={defaultOpen}
            disabled={disabled}
            onOpenChange={onOpenChange}
            open={open}
        >
            <AccordionItemPropsProvider props={props}>
                <AccordionTrigger />
                <AccordionContent>{children}</AccordionContent>
            </AccordionItemPropsProvider>
        </AccordionRoot>
    );
};

const DecoratableAccordionItem = makeDecoratable("AccordionItem", AccordionItemBase);

const AccordionItem = withStaticProps(DecoratableAccordionItem, {
    Icon: AccordionItemIcon,
    Action: AccordionItemAction
});

export { AccordionItem, type AccordionItemProps, useAccordionItemProps };
