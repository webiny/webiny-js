import React from "react";
import { Button } from "webiny/admin/ui";
import { TenantEntry } from "../../types";
import { useInstallTenant } from "./useInstallTenant";

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
