import React from "react";
import { css } from "emotion";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { AdminView } from "@webiny/app-admin/ui/views/AdminView";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import { useSecurity } from "@webiny/app-security";
import { Typography } from "@webiny/ui/Typography";

const button = css({ marginRight: 20 });

const CurrentTenant = () => {
    const { identity } = useSecurity();

    const { currentTenant, defaultTenant } = identity;

    if (currentTenant.id === "root") {
        return (
            <Typography className={button} use={"button"}>
                Root Tenant
            </Typography>
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
