import React from "react";
import { IconButton } from "~/Button/index.js";
import { Tooltip } from "~/Tooltip/index.js";

interface AccordionItemActionsProps {
    children: React.ReactNode;
}

export const AccordionItemActions = ({ children }: AccordionItemActionsProps) => {
    return <>{children}</>;
};

export interface AccordionItemActionProps {
    icon: React.JSX.Element;
    onClick: () => void;
    tooltip?: string;
    disabled?: boolean;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Accordion.Item.Action` component from the `@webiny/admin-ui` package instead.
 */
export const AccordionItemAction = ({
    icon,
    onClick,
    tooltip,
    disabled
}: AccordionItemActionProps) => {
    const iconButton = (
        <IconButton
            disabled={disabled}
            icon={icon}
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
        />
    );

    if (!tooltip) {
        return iconButton;
    }

    return (
        <Tooltip placement={"bottom"} content={tooltip}>
            {iconButton}
        </Tooltip>
    );
};

export interface AccordionItemElementProps {
    element: React.JSX.Element;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Accordion.Item.Action` component from the `@webiny/admin-ui` package instead.
 */
export const AccordionItemElement = ({ element }: AccordionItemElementProps) => {
    return <div onClick={e => e.stopPropagation()}>{element}</div>;
};
