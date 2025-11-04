import React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import type { AccordionRoot } from "./components/AccordionRoot.js";
import { AccordionItem, type AccordionItemProps } from "./components/AccordionItem.js";
import {
    AccordionBackgroundProvider,
    useAccordionBackground
} from "./components/AccordionBackgroundProvider.js";

const accordionVariants = cva("group w-full", {
    variants: {
        variant: {
            container: "accordion-variant-container gap-xs flex flex-col rounded-lg",
            underline: "accordion-variant-underline"
        },
        background: {
            base: "bg-neutral-base",
            light: "bg-neutral-light",
            transparent: "bg-transparent"
        }
    },
    defaultVariants: {
        variant: "container",
        background: "base"
    }
});

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionRoot> &
    VariantProps<typeof accordionVariants> & {
        children: React.ReactNode;
    };

const AccordionBase = ({
    children,
    variant,
    background: backgroundProp = "base",
    className
}: AccordionProps) => {
    const background = useAccordionBackground(backgroundProp);

    return (
        <AccordionBackgroundProvider currentBackground={background}>
            <div className={cn(accordionVariants({ variant, background }), className)}>
                {children}
            </div>
        </AccordionBackgroundProvider>
    );
};

const DecoratableAccordion = makeDecoratable("Accordion", AccordionBase);

export const Accordion = withStaticProps(DecoratableAccordion, {
    Item: AccordionItem
});

export type { AccordionProps, AccordionItemProps };
