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
            underline: "wby-accordion-variant-underline "
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

const DEPTH_BACKGROUNDS = {
    odd: "wby-bg-neutral-light",
    even: "wby-bg-neutral-base"
} as const;

const getBackgroundByDepth = (depth: number): string => {
    return depth % 2 === 0 ? DEPTH_BACKGROUNDS.even : DEPTH_BACKGROUNDS.odd;
};

const AccordionBase = ({ children, variant, className }: AccordionProps) => {
    const parentDepth = useDepth();
    const currentDepth = parentDepth + 1;
    const background = getBackgroundByDepth(currentDepth);

    return (
        <div className={cn(accordionVariants({ variant }), className, background)}>
            <DepthProvider value={currentDepth}>{children}</DepthProvider>
        </div>
    );
};

const DecoratableAccordion = makeDecoratable("Accordion", AccordionBase);

const Accordion = withStaticProps(DecoratableAccordion, {
    Item: AccordionItem
});

export { Accordion, type AccordionProps, type AccordionItemProps };
