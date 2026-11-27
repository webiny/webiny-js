import React from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ROOT_TENANT_ID } from "@webiny/app-admin";
import { TenantSwitcherManageItem } from "@webiny/app-admin";
import { useAuthentication } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { useTenantContext } from "@webiny/app-admin";
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

        const canUseMultiTenancy = featureFlags.isEnabled("multiTenancy");
        if (!isRootAdmin(identity, canUseMultiTenancy)) {
            return null;
        }

        const link = getLink(Routes.ContentEntries.List, { modelId: TENANT_MODEL_ID });

        // Tenant Manager lives in the root tenant: from any other tenant, switch to root first.
        const openTenantManager = () => {
            if (identity.currentTenant.id !== ROOT_TENANT_ID) {
                tenancy.setTenant(ROOT_TENANT_ID);
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
