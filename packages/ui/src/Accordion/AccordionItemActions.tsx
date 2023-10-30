import React from "react";
import { IconButton } from "~/Button";

export const AccordionItemActions: React.FC = ({ children }) => {
    return <>{children}</>;
};

export interface AccordionItemActionProps {
    icon: JSX.Element;
    onClick: () => void;
    disabled?: boolean;
}

export const AccordionItemAction = ({ icon, onClick, disabled }: AccordionItemActionProps) => {
    return (
        <IconButton
            disabled={disabled}
            icon={icon}
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
        />
    );
};

export interface AccordionItemElementProps {
    element: JSX.Element;
}

export const AccordionItemElement = ({ element }: AccordionItemElementProps) => {
    return <div onClick={e => e.stopPropagation()}>{element}</div>;
};
