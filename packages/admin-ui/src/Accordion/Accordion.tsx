import React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import type { AccordionRoot } from "./components/AccordionRoot.js";
import { AccordionItem, type AccordionItemProps } from "./components/AccordionItem.js";

const accordionVariants = cva("wby-group wby-w-full", {
    variants: {
        variant: {
            container: "wby-accordion-variant-container wby-gap-xs wby-flex wby-flex-col",
            underline: "wby-accordion-variant-underline "
        },
        background: {
            base: "wby-accordion-background-base",
            light: "wby-accordion-background-light",
            transparent: "wby-accordion-background-transparent"
        }
    },
    defaultVariants: {
        variant: "underline",
        background: "base"
    }
});

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionRoot> &
    VariantProps<typeof accordionVariants> & {
        children: React.ReactNode;
        colorMark?: string;
    };

const AccordionBase = ({ children, variant, background, className, ...props }: AccordionProps) => {
    return (
        <div {...props} className={cn(accordionVariants({ variant, background }), className)}>
            {children}
        </div>
    );
};

const DecoratableAccordion = makeDecoratable("Accordion", AccordionBase);

const Accordion = withStaticProps(DecoratableAccordion, {
    Item: AccordionItem
});

export { Accordion, type AccordionProps, type AccordionItemProps };
