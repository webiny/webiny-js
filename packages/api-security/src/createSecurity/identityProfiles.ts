import { SecurityContext } from "~/types";

export const applyIdentityProfilePlugin = (context: SecurityContext) => {
    context.security.onAfterLogin.subscribe(async ({ identity }) => {
        const tenant = context.tenancy.getCurrentTenant();

        console.log("identitatt");
        console.log(JSON.stringify(identity, null, 2));

        const profile = {
            id: identity.id,
            type: identity.type,
            displayName: identity.displayName
        };

        const identityTenantLink = await context.security.getTenantLinkByIdentity({
            tenant: tenant.id,
            identity: identity.id
        });

        if (identityTenantLink) {
            await context.security.updateTenantLinks([
                {
                    identity: identity.id,
                    tenant: tenant.id,
                    type: "group",
                    data: {
                        ...identityTenantLink.data,
                        profile
                    }
                }
            ]);
            return;
        }

        await context.security.createTenantLinks([
            {
                identity: identity.id,
                tenant: tenant.id,
                type: "group",
                data: {
                    groups: [],
                    teams: [],
                    profile
                }
            }
        ]);
    });
};
