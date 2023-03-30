import React from "react";
import { IconButton } from "~/Button";

interface AccordionItemActionsProps {
    children: React.ReactNode;
}

export const AccordionItemActions: React.VFC<AccordionItemActionsProps> = ({ children }) => {
    return <>{children}</>;
};

export interface AccordionItemActionProps {
    icon: JSX.Element;
    onClick: () => void;
    disabled?: boolean;
}

export const AccordionItemAction: React.VFC<AccordionItemActionProps> = ({
    icon,
    onClick,
    disabled
}) => {
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
