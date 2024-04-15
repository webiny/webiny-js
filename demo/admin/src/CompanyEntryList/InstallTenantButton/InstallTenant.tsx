import React from "react";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Company } from "../../types";
import { useInstallTenant } from "./useInstallTenant";

interface InstallTenantProps {
    company: Company;
}

export const InstallTenant = ({ company }: InstallTenantProps) => {
    const { installTenant, loading } = useInstallTenant(company);

    return (
        <ButtonPrimary onClick={installTenant} disabled={loading}>
            {loading ? "Installing..." : "Install"}
        </ButtonPrimary>
    );
};
