import React, { useCallback } from "react";
import { useTenancy } from "@webiny/app-tenancy";
import { Button } from "@webiny/admin-ui";
import type { CompanyEntry } from "../types";

interface ManageTenantProps {
    company: CompanyEntry;
}

export const ManageTenant = ({ company }: ManageTenantProps) => {
    const { setTenant } = useTenancy();
    const switchToTenant = useCallback(() => {
        localStorage.removeItem("webiny_wb_page_latest_visited_folder");
        setTenant(company.entryId);
    }, [company]);

    return <Button variant={"secondary"} onClick={switchToTenant} text={"Manage"} />;
};
