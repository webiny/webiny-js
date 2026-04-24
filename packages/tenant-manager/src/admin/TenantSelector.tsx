import React from "react";
import { TenantSelector as BaseTenantSelector } from "@webiny/app-admin";
import { CopyButton, Icon, Tooltip, useToast } from "@webiny/admin-ui";
import { useAuthentication } from "@webiny/app-admin";
import { ReactComponent as TenantIcon } from "@webiny/icons/business.svg";

export const TenantSelector = BaseTenantSelector.createDecorator(() => {
    return function TenantSelector() {
        const { identity } = useAuthentication();
        const currentTenant = identity.currentTenant;
        const toast = useToast();

        const confirmClipboard = () => {
            toast.showSuccessToast({
                title: "Tenant ID copied to clipboard!"
            });
        };

        return (
            <Tooltip
                content={
                    <div className={"flex items-center gap-x-xs"}>
                        ID: {currentTenant.id}
                        <CopyButton
                            size="sm"
                            value={currentTenant.id}
                            onCopy={confirmClipboard}
                            variant={"ghost-negative"}
                        />
                    </div>
                }
                side={"bottom"}
                trigger={
                    <div className={"flex items-center gap-x-xs cursor-pointer"}>
                        <Icon
                            label="Root tenant"
                            icon={<TenantIcon />}
                            className={"fill-neutral-xstrong"}
                        />
                        {currentTenant.name}
                    </div>
                }
            />
        );
    };
});
