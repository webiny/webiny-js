import { makeDecoratable } from "@webiny/app";

/**
 * The last item of the tenant switcher's menu, for root admins: "Manage tenants". Renders nothing
 * until Tenant Manager decorates it.
 */
export const TenantSwitcherManageItem = makeDecoratable("TenantSwitcherManageItem", () => {
    return null;
});
