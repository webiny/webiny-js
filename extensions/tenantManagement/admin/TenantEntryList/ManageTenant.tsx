import React, { useCallback } from "react";
import { Button } from "webiny/admin/ui";
import { useTenantContext } from "webiny/admin/tenancy";
import type { TenantEntry } from "../types";

interface ManageTenantProps {
    tenant: TenantEntry;
}

export const ManageTenant = ({ tenant }: ManageTenantProps) => {
    const { setTenant } = useTenantContext();
    const switchToTenant = useCallback(() => {
        localStorage.removeItem("webiny_wb_page_latest_visited_folder");
        setTenant(tenant.entryId);
    }, [tenant]);

    return <Button variant={"secondary"} onClick={switchToTenant} text={"Manage"} />;
};
