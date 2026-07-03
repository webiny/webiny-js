import React from "react";
import { AdminConfig, HasPermission, RegisterFeature } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "@webiny/app-headless-cms";
import { ReactComponent as TenantIcon } from "@webiny/icons/business.svg";

import { TenantEntryList } from "./TenantEntryList.js";
import { CurrentTenantProvider } from "./CurrentTenantProvider.js";
import { CurrentTenantFeature } from "./CurrentTenant/feature.js";
import { DisableTenantFeature } from "./DisableTenant/index.js";
import { EnableTenantFeature } from "./EnableTenant/index.js";
import { TenantSelector } from "./TenantSelector.js";
import { IsRootTenant } from "./IsRootTenant.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import { SecurityPermission } from "./SecurityPermission.js";
import { TmPermissionsFeature } from "./features/permissions/feature.js";
import { InstallTenantFeature } from "./InstallTenant/index.js";

const { Menu } = AdminConfig;

export const Extension = () => {
    const { getLink } = useRouter();

    const link = getLink(Routes.ContentEntries.List, { modelId: TENANT_MODEL_ID });

    const icon = <Menu.Link.Icon element={<TenantIcon />} label={"Tenant"} />;

    return (
        <>
            <RegisterFeature feature={CurrentTenantFeature} />
            <RegisterFeature feature={TmPermissionsFeature} />
            <RegisterFeature feature={InstallTenantFeature} />
            <CurrentTenantProvider />
            <TenantSelector />
            <TenantEntryList />
            <SecurityPermission />
            <AdminConfig>
                <IsRootTenant>
                    <RegisterFeature feature={DisableTenantFeature} />
                    <RegisterFeature feature={EnableTenantFeature} />
                    <HasPermission name={"tm.tenant"}>
                        <Menu
                            name="tenantManager"
                            element={<Menu.Link text="Tenant Manager" icon={icon} to={link} />}
                        />
                    </HasPermission>
                </IsRootTenant>
            </AdminConfig>
        </>
    );
};
