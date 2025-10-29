import React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import type { AccordionRoot } from "./components/AccordionRoot.js";
import { AccordionItem, type AccordionItemProps } from "./components/AccordionItem.js";
import {
    AccordionBackgroundProvider,
    useAccordionBackground
} from "./components/AccordionBackgroundProvider.tsx";

const accordionVariants = cva("wby-group wby-w-full", {
    variants: {
        variant: {
            container:
                "wby-accordion-variant-container wby-gap-xs wby-flex wby-flex-col wby-rounded-lg",
            underline: "wby-accordion-variant-underline"
        },
        background: {
            base: "wby-bg-neutral-base",
            light: "wby-bg-neutral-light",
            transparent: "wby-bg-transparent"
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
    console.log("backgroundProp", backgroundProp, background);

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
