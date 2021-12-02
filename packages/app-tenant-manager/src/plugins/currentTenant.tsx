import React, { Fragment, useState } from "react";
import { css } from "emotion";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { AdminView } from "@webiny/app-admin/ui/views/AdminView";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import { useSecurity } from "@webiny/app-security";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as EditIcon } from "~/assets/edit.svg";
import { useCallback } from "react";
import { SettingsDialog } from "./currentTenant/SettingsDialog";

const button = css`
    margin-right: 20px;
`;

const action = css`
    display: flex;
    cursor: pointer;
    > svg {
        color: #fff;
        align-self: center;
        display: none;
        margin-right: 5px;
    }
    :hover > svg {
        display: inline;
    }
`;

const CurrentTenant = () => {
    const { identity } = useSecurity();
    const [settingsShown, showSettings] = useState(false);

    const { currentTenant, defaultTenant } = identity;

    const closeDialog = useCallback(() => showSettings(false), []);

    if (currentTenant.id === "root") {
        return (
            <Fragment>
                <SettingsDialog open={settingsShown} onClose={closeDialog} />
                <Typography className={button} use={"button"}>
                    <span className={action} onClick={() => showSettings(true)}>
                        <EditIcon />
                        Root Tenant
                    </span>
                </Typography>
            </Fragment>
        );
    }

    if (currentTenant.id !== "root" && currentTenant.id !== defaultTenant.id) {
        return (
            <Typography className={button} use={"button"}>
                {currentTenant.name}
            </Typography>
        );
    }

    return null;
};

export default new UIViewPlugin<AdminView>(AdminView, view => {
    const tenantSelector = new GenericElement("tenantSelector", () => <CurrentTenant />);
    tenantSelector.moveToTheBeginningOf(view.getHeaderElement().getRightSection());
});
