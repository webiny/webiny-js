import React, { Fragment } from "react";
import { ReactComponent as MoreVerticalIcon } from "@material-design-icons/svg/outlined/more_vert.svg";
import { IconButton } from "@webiny/ui/Button";

import { OptionMenuItemProvider } from "./useOptionMenuItem";

import { Menu } from "./OptionsMenu.styles";

export interface OptionsMenuProps {
    actions: {
        name: string;
        element: React.ReactElement;
    }[];
    ["data-testid"]?: string;
}

export const OptionsMenu: React.VFC<OptionsMenuProps> = props => {
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
                    <OptionMenuItemProvider>{action.element}</OptionMenuItemProvider>
                </Fragment>
            ))}
        </Menu>
    );
};
