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

const getBackgroundByDepth = (
    depth: number,
    background: AccordionProps["background"]
): AccordionProps["background"] => {
    // If background is explicitly provided, use it at any depth
    if (background) {
        return background;
    }

    // For nested levels, alternate between light and base
    return depth % 2 === 0 ? "light" : "base";
};

const AccordionBase = ({ children, variant, background, className }: AccordionProps) => {
    const currentDepth = useDepth() + 1;
    const bg = getBackgroundByDepth(currentDepth, background);

    return (
        <div className={cn(accordionVariants({ variant, background: bg }), className)}>
            <DepthProvider value={currentDepth}>{children}</DepthProvider>
        </div>
    );
};

const DecoratableAccordion = makeDecoratable("Accordion", AccordionBase);

export const Accordion = withStaticProps(DecoratableAccordion, {
    Item: AccordionItem
});

export type { AccordionProps, AccordionItemProps };
