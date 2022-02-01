import { SecurityContext } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

export type Context = SecurityContext & TenancyContext;

export const getDefaultTenant = async ({ security, tenancy }: Context) => {
    const identity = security.getIdentity();

    const links = await security.listTenantLinksByIdentity({
        identity: identity.id
    });

    // We need to find the oldest link, and that's our "default" tenant.
    links.sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime());

    if (!links.length) {
        return undefined;
    }

    const { tenant } = links[0];
    return await tenancy.getTenantById(tenant);
};
