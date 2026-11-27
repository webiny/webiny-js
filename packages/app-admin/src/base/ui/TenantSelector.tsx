import React from "react";
import { makeDecoratable } from "@webiny/app";

export interface TenantSelectorProps {
    /**
     * The admin title (`AdminConfig.Title`). Shown as is when there is nothing to do with tenants.
     */
    title: string;
}

/**
 * The label in the sidebar header, next to the logo. The admin UI renders it as the current tenant,
 * with a menu to switch or exit the tenant, when the user is in a tenant other than their default
 * one or can switch between tenants.
 */
export const TenantSelector = makeDecoratable("TenantSelector", (props: TenantSelectorProps) => {
    return <TenantSelectorRenderer {...props} />;
});

export const TenantSelectorRenderer = makeDecoratable(
    "TenantSelectorRenderer",
    ({ title }: TenantSelectorProps) => {
        return <>{title}</>;
    }
);
