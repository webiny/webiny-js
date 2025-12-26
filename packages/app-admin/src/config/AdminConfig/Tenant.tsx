import React from "react";
import { makeDecoratable } from "~/index.js";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
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
    const getId = useIdGenerator("Tenant");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={getId("tenant")} name={"tenant"}>
                {children}
            </Property>
        </ConnectToProperties>
    );
};

const DecoratableTenant = makeDecoratable("Tenant", BaseTenant);

export const Tenant = Object.assign(DecoratableTenant, {
    Name: TenantName,
    Logo: TenantLogo
});
