import React from "react";
import {
    Accordion as ChakraAccordion,
    AccordionProps as ChakraAccordionProps,
    AccordionItem as ChakraAccordionItem
} from "@chakra-ui/react";
import classNames from "classnames";

export interface AccordionProps extends ChakraAccordionProps {
    /**
     * Element displayed when accordion is expanded.
     */
    children:
        | React.ReactElement<typeof ChakraAccordionItem>
        | React.ReactElement<typeof ChakraAccordionItem>[];

    /**
     * Elevation number, default set to 2
     * @deprecated
     */
    elevation?: number;

    /**
     * Append a class name
     */
    className?: string;
}

export const Accordion = ({ children, className, ...others }: AccordionProps) => {
    return (
        <ChakraAccordion {...others} className={classNames("webiny-ui-accordion", className)}>
            {children}
        </ChakraAccordion>
    );
};
