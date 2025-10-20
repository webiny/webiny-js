import React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import type { AccordionRoot } from "./components/AccordionRoot.js";
import { AccordionItem, type AccordionItemProps } from "./components/AccordionItem.js";

const accordionVariants = cva("group w-full", {
    variants: {
        variant: {
            container: "accordion-variant-container gap-xs flex flex-col",
            underline: "accordion-variant-underline "
        },
        background: {
            base: "accordion-background-base",
            light: "accordion-background-light",
            transparent: "accordion-background-transparent"
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
