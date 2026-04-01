import React, { Fragment } from "react";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { IconButton, DropdownMenu } from "@webiny/admin-ui";
import { OptionsMenuItemProvider } from "./useOptionsMenuItem.js";

export interface OptionsMenuProps {
    variant?: React.ComponentProps<typeof IconButton>["variant"];
    actions: {
        name: string;
        element: React.ReactElement;
    }[];
    trigger?: React.ReactElement;
    ["data-testid"]?: string;
}

export const OptionsMenu = (props: OptionsMenuProps) => {
    if (!props.actions.length) {
        return null;
    }

    const trigger = props.trigger || (
        <IconButton
            icon={<MoreVerticalIcon />}
            size={"md"}
            iconSize={"lg"}
            variant={props.variant ?? "ghost"}
            data-testid={props["data-testid"] || "more-options-icon"}
        />
    );

    return (
        <DropdownMenu trigger={trigger}>
            {props.actions.map(action => (
                <Fragment key={action.name}>
                    <OptionsMenuItemProvider>{action.element}</OptionsMenuItemProvider>
                </Fragment>
            ))}
        </DropdownMenu>
    );
};
