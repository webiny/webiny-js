import React from "react";
import { IconButton } from "~/Button";
import { Flex } from "@chakra-ui/react";

interface AccordionItemActionsProps {
    children: React.ReactNode;
}

export const AccordionItemActions = ({ children }: AccordionItemActionsProps) => {
    return <Flex alignItems={"center"}>{children}</Flex>;
};

export interface AccordionItemActionProps {
    icon: JSX.Element;
    onClick: () => void;
    disabled?: boolean;
}

export const AccordionItemAction = ({ icon, onClick, disabled }: AccordionItemActionProps) => {
    return (
        <IconButton
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
            variant={"ghost"}
            size={"sm"}
            disabled={disabled}
            icon={icon}
        />
    );
};

export interface AccordionItemElementProps {
    element: JSX.Element;
}

export const AccordionItemElement = ({ element }: AccordionItemElementProps) => {
    return <div onClick={e => e.stopPropagation()}>{element}</div>;
};
