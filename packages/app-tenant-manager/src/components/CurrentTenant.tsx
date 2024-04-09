import React, { Fragment, useCallback, useState } from "react";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as TenantIcon } from "~/assets/business_black_24dp.svg";
import { SettingsDialog } from "./CurrentTenant/SettingsDialog";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";

export const CurrentTenant = () => {
    const { identity } = useSecurity();
    const [settingsShown, showSettings] = useState(false);

    const { currentTenant, defaultTenant } = identity || {
        currentTenant: null,
        defaultTenant: null
    };

    const currentTenantId = currentTenant ? currentTenant.id : "unknown";
    const defaultTenantId = defaultTenant ? defaultTenant.id : "unknown";

    const closeDialog = useCallback(() => showSettings(false), []);

    if (currentTenantId === "root") {
        return (
            <Fragment>
                <SettingsDialog open={settingsShown} onClose={closeDialog} />
                <ButtonPrimary flat onClick={() => showSettings(true)}>
                    <ButtonIcon icon={<TenantIcon />} />
                    Root Tenant
                </ButtonPrimary>
            </Fragment>
        );
    }

    if (currentTenantId !== "root" && currentTenantId !== defaultTenantId) {
        return (
            <ButtonDefault flat disabled style={{ color: "white" }}>
                <ButtonIcon icon={<TenantIcon />} />
                {currentTenant.name}
            </ButtonDefault>
        );
    }

    return null;
};
