import React from "react";
import { makeDecoratable } from "~/index.js";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface TenantNameProps {
    value: string;
}

const BaseTenantName = ({ value }: TenantNameProps) => {
    const getId = useIdGenerator("Tenant");

    return (
        <Property id={getId("tenant")} name={"tenant"}>
            <Property id={getId("name")} name={"name"} value={value} />
        </Property>
    );
};

export const TenantName = makeDecoratable("TenantName", BaseTenantName);
