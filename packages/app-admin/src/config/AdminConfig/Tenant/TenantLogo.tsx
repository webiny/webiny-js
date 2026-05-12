import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface TenantLogoProps {
    squareLogo: React.ReactNode;
    horizontalLogo?: React.ReactNode;
}

const BaseTenantLogo = ({ squareLogo, horizontalLogo }: TenantLogoProps) => {
    const getId = useIdGenerator("Tenant");

    return (
        <Property id={getId("tenant")} name={"tenant"}>
            <Property id={getId("squareLogo")} name={"squareLogo"} value={squareLogo} />
            <Property
                id={getId("horizontalLogo")}
                name={"horizontalLogo"}
                value={horizontalLogo ?? squareLogo}
            />
        </Property>
    );
};

export const TenantLogo = makeDecoratable("TenantLogo", BaseTenantLogo);
