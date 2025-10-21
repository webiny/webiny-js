import React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import type { AccordionRoot } from "./components/AccordionRoot.js";
import { AccordionItem, type AccordionItemProps } from "./components/AccordionItem.js";
import { DepthProvider, useDepth } from "./DepthContext.js";

const accordionVariants = cva("wby-group wby-w-full", {
    variants: {
        variant: {
            container:
                "wby-accordion-variant-container wby-gap-xs wby-flex wby-flex-col wby-rounded-lg",
            underline: "wby-accordion-variant-underline"
        }
    },
    defaultVariants: {
        variant: "container"
    }
});

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionRoot> &
    VariantProps<typeof accordionVariants> & {
        children: React.ReactNode;
    };

const getBackgroundByDepth = (depth: number): string => {
    return depth % 2 === 0 ? "wby-bg-neutral-base" : "wby-bg-neutral-light";
};

const AccordionBase = ({ children, variant, className }: AccordionProps) => {
    const currentDepth = useDepth() + 1;
    const background = getBackgroundByDepth(currentDepth);

    return (
        <div className={cn(accordionVariants({ variant }), className, background)}>
            <DepthProvider value={currentDepth}>{children}</DepthProvider>
        </div>
    );
};

const DecoratableAccordion = makeDecoratable("Accordion", AccordionBase);

export const Accordion = withStaticProps(DecoratableAccordion, {
    Item: AccordionItem
});

export type { AccordionProps, AccordionItemProps };
