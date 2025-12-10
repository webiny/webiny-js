import React from "react";
import { makeDecoratable, withStaticProps, cva, type VariantProps, cn } from "~/utils.js";
import type { AccordionRoot } from "./components/AccordionRoot.js";
import { AccordionItem, type AccordionItemProps } from "./components/AccordionItem.js";
import {
    AccordionBackgroundProvider,
    useAccordionBackground
} from "./components/AccordionBackgroundProvider.js";
import {
    AccordionPropsProvider,
    useAccordionProps
} from "./components/AccordionPropsProvider.js";

const accordionVariants = cva("group w-full", {
    variants: {
        variant: {
            container: "accordion-variant-container gap-xs flex flex-col rounded-lg",
            underline: "accordion-variant-underline"
        },
        border: {
            none: "",
            accent: "border-md border-neutral-dimmed-darker"
        }
    },
    defaultVariants: {
        variant: "underline"
    }
});

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionRoot> &
    VariantProps<typeof accordionVariants> & {
        children: React.ReactNode;
        background?: "base" | "light" | "transparent"
    };

const AccordionBase = (props: AccordionProps) => {
    const providedProps = useAccordionProps();
    const mergedProps = { ...providedProps, ...props };

    const {
        children,
        variant,
        border,
        background: backgroundProp = "light",
        className
    } = mergedProps;

    const background = useAccordionBackground(backgroundProp);

    return (
        <AccordionBackgroundProvider currentBackground={background}>
            <AccordionPropsProvider props={mergedProps}>
                <div className={cn(accordionVariants({ variant, border }), className)}>
                    {children}
                </div>
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
