import React from "react";
import {
    AccordionItem as ChakraAccordionItem,
    AccordionItemProps as ChakraAccordionItemProps,
    AccordionButton as ChakraAccordionButton,
    AccordionPanel as ChakraAccordionPanel,
    AccordionIcon as ChakraAccordionIcon,
    Flex,
    Spacer,
    Heading
} from "@chakra-ui/react";
import classNames from "classnames";
import { Box } from "~/Box";
import { AccordionDivider } from "~/Accordion/AccordionDivider";
import {
    AccordionItemAction,
    AccordionItemActions,
    AccordionItemElement
} from "~/Accordion/AccordionItemActions";

export interface AccordionItemProps extends Omit<ChakraAccordionItemProps, "title"> {
    /**
     * Can user toggle the accordion item by clicking it? Defaults to `true`.
     */
    interactive?: boolean;
    /**
     * Actions to show on the right side of the accordion item
     */
    actions?: React.ReactElement | null;
    /**
     * Left side icon
     */
    icon?: React.ReactElement | null;

    /**
     * Accordion title
     */
    title?: React.ReactNode;

    /**
     * Optional description
     */
    description?: string;

    /**
     * Append a class name
     */
    className?: string;

    /**
     * Render item opened by default
     */
    open?: boolean;
    /**
     * For testing purpose
     */
    "data-testid"?: string;
    /**
     * Append a class name to Icon
     */
    iconClassName?: string;

    children: React.ReactNode;
}

export const AccordionItemComponent = ({
    children,
    className,
    title,
    description,
    actions,
    icon,
    ...others
}: AccordionItemProps) => {
    return (
        <ChakraAccordionItem
            {...others}
            className={classNames("webiny-ui-accordion-item", className)}
        >
            {({ isExpanded }) => (
                <>
                    <ChakraAccordionButton as={"div"} cursor={"pointer"}>
                        <Flex alignItems={"center"} width={"full"} textAlign="left">
                            {icon && (
                                <Box mr={6} fill={isExpanded ? "brand.500" : "gray.500"}>
                                    {icon}
                                </Box>
                            )}
                            <Box>
                                {title ? (
                                    <Heading as="h2" size="xs">
                                        {title}
                                    </Heading>
                                ) : null}
                                {description ? description : null}
                            </Box>
                            <Spacer />
                            <Box>
                                <Flex alignItems={"stretch"}>
                                    {actions ? (
                                        <>
                                            <Box>{actions}</Box>
                                            <AccordionDivider />
                                        </>
                                    ) : null}
                                    <Box>
                                        <ChakraAccordionIcon
                                            bg={isExpanded ? "gray.200" : "transparent"}
                                        />
                                    </Box>
                                </Flex>
                            </Box>
                        </Flex>
                    </ChakraAccordionButton>
                    <ChakraAccordionPanel>{children}</ChakraAccordionPanel>
                </>
            )}
        </ChakraAccordionItem>
    );
};

type AccordionItem = React.ComponentType<AccordionItemProps> & {
    Divider: typeof AccordionDivider;
    Actions: typeof AccordionItemActions;
    Action: typeof AccordionItemAction;
    Element: typeof AccordionItemElement;
};

export const AccordionItem: AccordionItem = Object.assign(AccordionItemComponent, {
    Divider: AccordionDivider,
    Action: AccordionItemAction,
    Actions: AccordionItemActions,
    Element: AccordionItemElement
});
