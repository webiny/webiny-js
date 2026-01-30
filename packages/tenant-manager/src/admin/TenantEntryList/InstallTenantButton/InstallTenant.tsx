import React from "react";
import { Button } from "@webiny/admin-ui";
import { TenantEntry } from "../../types.js";
import { useInstallTenant } from "./useInstallTenant.js";

interface InstallTenantProps {
    tenant: TenantEntry;
}

export const InstallTenant = ({ tenant }: InstallTenantProps) => {
    const { installTenant, loading } = useInstallTenant(tenant);

    return (
        <Button
            variant={"primary"}
            onClick={installTenant}
            disabled={loading}
            text={loading ? "Installing..." : "Install"}
        />
    );
};
