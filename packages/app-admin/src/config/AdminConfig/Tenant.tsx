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

export const Tenant = Object.assign(BaseTenant, {
    Name: TenantName,
    Logo: TenantLogo
});
