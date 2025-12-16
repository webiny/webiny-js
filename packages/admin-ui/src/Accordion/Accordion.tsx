import React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import type { AccordionRoot } from "./components/AccordionRoot.js";
import { AccordionItem, type AccordionItemProps } from "./components/AccordionItem.js";
import {
    AccordionBackgroundProvider,
    useAccordionBackground
} from "./components/AccordionBackgroundProvider.js";
import { AccordionPropsProvider, useAccordionProps } from "./components/AccordionPropsProvider.js";

const accordionVariants = cva("group w-full", {
    variants: {
        variant: {
            container: "accordion-variant-container gap-xs flex flex-col rounded-lg",
            underline: "accordion-variant-underline"
        }
    },
    defaultVariants: {
        variant: "underline"
    }
});

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionRoot> &
    VariantProps<typeof accordionVariants> & {
        children: React.ReactNode;
        background?: "base" | "light" | "transparent";
        border?: "none" | "accent";
        openClosedIndicatorPosition?: "left" | "right";
    };

const AccordionBase = (props: AccordionProps) => {
    const { children, variant, background: backgroundProp = "light", className } = props;

    const background = useAccordionBackground(backgroundProp);

    return (
        <AccordionBackgroundProvider currentBackground={background}>
            <AccordionPropsProvider props={props}>
                <div className={cn(accordionVariants({ variant }), className)}>{children}</div>
            </AccordionPropsProvider>
        </AccordionBackgroundProvider>
    );
};

const DecoratableAccordion = makeDecoratable("Accordion", AccordionBase);

export const Accordion = withStaticProps(DecoratableAccordion, {
    Item: AccordionItem
});

export { useAccordionProps };
export type { AccordionProps, AccordionItemProps };
