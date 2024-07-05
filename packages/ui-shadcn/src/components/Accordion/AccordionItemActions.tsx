import React from "react";
import { IconButton } from "~/components/Button";

interface AccordionItemActionsProps {
    children: React.ReactNode;
}

export const AccordionItemActions = ({ children }: AccordionItemActionsProps) => {
    return <div className={"flex items-center"}>{children}</div>;
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
            className={"ml-4"}
        />
    );
};

export interface AccordionItemElementProps {
    element: JSX.Element;
}

export const AccordionItemElement = ({ element }: AccordionItemElementProps) => {
    return <div onClick={e => e.stopPropagation()}>{element}</div>;
};
