import React from "react";
import { AdminConfig, HasPermission, RegisterFeature } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "@webiny/app-headless-cms";
import { ReactComponent as TenantIcon } from "@webiny/icons/business.svg";
import { TenantEntryList } from "./TenantEntryList.js";
import { CurrentTenantProvider } from "./CurrentTenantProvider.js";
import { CurrentTenantFeature } from "./CurrentTenant/feature.js";
import { TenantSelector } from "./TenantSelector.js";
import { IsRootTenant } from "./IsRootTenant.js";
import { LegacyPermissionRenderer } from "./Permissions/LegacyPermissionRenderer.js";

const { Menu } = AdminConfig;

export const Extension = () => {
    const { getLink } = useRouter();
    return (
        <>
            <RegisterFeature feature={CurrentTenantFeature} />
            <CurrentTenantProvider />
            <TenantSelector />
            <TenantEntryList />
            <LegacyPermissionRenderer />
            <AdminConfig>
                <IsRootTenant>
                    <HasPermission name={"tm.*"}>
                        <Menu
                            name="tenantManager"
                            element={
                                <Menu.Link
                                    text="Tenant Manager"
                                    icon={
                                        <Menu.Link.Icon element={<TenantIcon />} label={"Tenant"} />
                                    }
                                    to={getLink(Routes.ContentEntries.List, {
                                        modelId: "wbyTenant"
                                    })}
                                />
                            }
                        />
                    </HasPermission>
                </IsRootTenant>
            </AdminConfig>
        </>
    );
};
