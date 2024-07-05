import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import classNames from "classnames";

type AccordionProps = React.ComponentProps<typeof AccordionPrimitive.Root> & {
    /**
     * Element displayed when accordion is expanded.
     */
    children:
        | React.ReactElement<AccordionPrimitive.AccordionItemProps>
        | React.ReactElement<AccordionPrimitive.AccordionItemProps>[];

    /**
     * Elevation number, default set to 2
     * @deprecated
     */
    elevation?: number;

    /**
     * Append a class name
     */
    className?: string;
};

export const Accordion = ({ children, className, ...others }: AccordionProps) => {
    return (
        <AccordionPrimitive.Root
            {...others}
            className={classNames("webiny-ui-accordion", className)}
        >
            {children}
        </AccordionPrimitive.Root>
    );
};
