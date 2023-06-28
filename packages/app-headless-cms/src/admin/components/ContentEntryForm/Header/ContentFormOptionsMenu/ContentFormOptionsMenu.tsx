import React, { Fragment } from "react";
import { ReactComponent as MoreVerticalIcon } from "@material-design-icons/svg/outlined/more_vert.svg";

import { useContentEntryEditorConfig } from "~/admin/config/contentEntries";

import { Menu, IconButton } from "./ContentFormOptionsMenu.styles";

export const ContentFormOptionsMenu: React.VFC = () => {
    const { form } = useContentEntryEditorConfig();

    if (!form.actions.length) {
        return null;
    }

    return (
        <Menu
            handle={
                <IconButton
                    icon={<MoreVerticalIcon />}
                    data-testid={"cms.content-form.header.more-options"}
                />
            }
        >
            {form.actions
                .filter(action => action.position === "tertiary")
                .map(action => (
                    <Fragment key={action.name}>{action.element}</Fragment>
                ))}
        </Menu>
    );
};
