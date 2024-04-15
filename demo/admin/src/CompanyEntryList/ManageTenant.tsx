import React, { useCallback } from "react";
import { useTenancy } from "@webiny/app-tenancy";
import { ButtonSecondary } from "@webiny/ui/Button";
import { Company } from "../types";

interface ManageTenantProps {
    company: Company;
}

export const ManageTenant = ({ company }: ManageTenantProps) => {
    const { setTenant } = useTenancy();
    const switchToTenant = useCallback(() => {
        setTenant(company.entryId);
    }, [company]);

    return <ButtonSecondary onClick={switchToTenant}>Manage Tenant</ButtonSecondary>;
};
