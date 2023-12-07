import React, { Fragment } from "react";
import { ReactComponent as MoreVerticalIcon } from "@material-design-icons/svg/outlined/more_vert.svg";
import { IconButton } from "@webiny/ui/Button";

import { OptionsMenuItemProvider } from "./useOptionsMenuItem";

import { Menu } from "./OptionsMenu.styled";

export interface OptionsMenuProps {
    actions: {
        name: string;
        element: React.ReactElement;
    }[];
    ["data-testid"]?: string;
}

export const OptionsMenu = (props: OptionsMenuProps) => {
    if (!props.actions.length) {
        return null;
    }

    return (
        <Menu
            handle={
                <IconButton
                    icon={<MoreVerticalIcon />}
                    data-testid={props["data-testid"] || "more-options-icon"}
                />
            }
        >
            {props.actions.map(action => (
                <Fragment key={action.name}>
                    <OptionsMenuItemProvider>{action.element}</OptionsMenuItemProvider>
                </Fragment>
            ))}
        </Menu>
    );
};
