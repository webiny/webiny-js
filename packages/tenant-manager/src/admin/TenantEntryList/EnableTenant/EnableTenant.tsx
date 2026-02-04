import React from "react";
import { Button } from "@webiny/admin-ui";
import { TenantEntry } from "../../types.js";
import { useEnableTenant } from "./useEnableTenant.js";

interface EnableTenantProps {
    tenant: TenantEntry;
}

export const EnableTenant = ({ tenant }: EnableTenantProps) => {
    const { enableTenant, loading } = useEnableTenant(tenant);

    return (
        <Button
            variant={"primary"}
            onClick={enableTenant}
            disabled={loading}
            text={loading ? "Enabling..." : "Enable"}
        />
    );
};
