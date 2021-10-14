import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityContext } from "~/types";
import { Response } from "@webiny/handler-graphql";

type Context = SecurityContext & TenancyContext;

const getDefaultTenant = async ({ security, tenancy }) => {
    const identity = security.getIdentity();

    const links = await security.listTenantLinksByIdentity({
        identity: identity.id
    });

    // We need to find the oldest link, and that's our "default" tenant.
    links.sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime());

    const { tenant } = links[0];
    return await tenancy.getTenantById(tenant);
};

export default () => {
    return [
        new GraphQLSchemaPlugin<Context>({
            typeDefs: /* GraphQL */ `
                extend interface SecurityIdentity {
                    currentTenant: Tenant
                    defaultTenant: Tenant
                }

                extend type TenancyQuery {
                    getDefaultTenant: TenantResponse
                }
            `,
            resolvers: {
                TenancyQuery: {
                    async getDefaultTenant(_, args, context) {
                        return new Response(await getDefaultTenant(context));
                    }
                },
                SecurityIdentity: {
                    defaultTenant(_, args, context) {
                        return getDefaultTenant(context);
                    },
                    currentTenant(identity, args, context) {
                        return context.tenancy.getCurrentTenant();
                    }
                }
            }
        })
    ];
};
