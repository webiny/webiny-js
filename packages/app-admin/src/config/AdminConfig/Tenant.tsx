import React from "react";
import { TenantName } from "./Tenant/TenantName.js";
import { TenantLogo } from "./Tenant/TenantLogo.js";

export interface TenantProps {
    children: React.ReactNode;
}

export type TenantConfig = {
    name: string;
    squareLogo: React.ReactNode;
    horizontalLogo: React.ReactNode;
};

const BaseTenant = ({ children }: TenantProps) => {
    return <>{children}</>;
};

/**
 * @deprecated Use AdminConfig.Title and AdminConfig.Logo directly instead of AdminConfig.Tenant.Name and AdminConfig.Tenant.Logo
 */
export const Tenant = Object.assign(BaseTenant, {
    /**
     * @deprecated Use AdminConfig.Title instead
     */
    Name: TenantName,
    /**
     * @deprecated Use AdminConfig.Logo instead
     */
    Logo: TenantLogo
});
