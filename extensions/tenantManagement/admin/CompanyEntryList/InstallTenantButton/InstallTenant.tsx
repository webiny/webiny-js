import React from "react";
import { Button } from "@webiny/admin-ui";
import { CompanyEntry } from "../../types";
import { useInstallTenant } from "./useInstallTenant";

interface InstallTenantProps {
  company: CompanyEntry;
}

export const InstallTenant = ({ company }: InstallTenantProps) => {
  const { installTenant, loading } = useInstallTenant(company);

  return (
    <Button
      variant={"primary"}
      onClick={installTenant}
      disabled={loading}
      text={loading ? "Installing..." : "Install"}
    />
  );
};
