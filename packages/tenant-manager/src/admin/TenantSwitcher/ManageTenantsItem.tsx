import React from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import {
    TenantSwitcherManageItem,
    useAuthentication,
    useFeatureFlags,
    useRouter,
    useTenantContext
} from "@webiny/app-admin";
import { Routes } from "@webiny/app-headless-cms";
import { ReactComponent as TenantIcon } from "@webiny/icons/business.svg";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import { isRootAdmin } from "./isRootAdmin.js";

export const ManageTenantsItem = TenantSwitcherManageItem.createDecorator(() => {
    return function ManageTenantsItem() {
        const { identity } = useAuthentication();
        const featureFlags = useFeatureFlags();
        const tenancy = useTenantContext();
        const { getLink } = useRouter();

        if (!isRootAdmin(identity, featureFlags.isEnabled("multiTenancy"))) {
            return null;
        }

        const link = getLink(Routes.ContentEntries.List, { modelId: TENANT_MODEL_ID });

        // Tenant Manager lives in the root tenant: from any other tenant, switch to root first.
        const openTenantManager = () => {
            if (identity.currentTenant.id !== "root") {
                tenancy.setTenant("root");
            }
            window.location.assign(link);
        };

        return (
            <>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                    icon={<DropdownMenu.Item.Icon element={<TenantIcon />} label={"Tenants"} />}
                    text={"Manage tenants"}
                    onClick={openTenantManager}
                />
            </>
        );
    };
});
