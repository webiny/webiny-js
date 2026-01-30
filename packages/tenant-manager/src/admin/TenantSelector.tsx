import React from "react";
import { TenantSelector as BaseTenantSelector } from "@webiny/app-admin";
import { Icon } from "@webiny/admin-ui";
import { useAuthentication } from "@webiny/app-admin";
import { ReactComponent as TenantIcon } from "@webiny/icons/business.svg";

export const TenantSelector = BaseTenantSelector.createDecorator(() => {
    return function TenantSelector() {
        const { identity } = useAuthentication();
        const currentTenant = identity.currentTenant;

        return (
            <div className={"flex items-center gap-x-xs"}>
                <Icon
                    label="Root tenant"
                    icon={<TenantIcon />}
                    className={"fill-neutral-xstrong"}
                />
                {currentTenant.name}
            </div>
        );
    };
});
