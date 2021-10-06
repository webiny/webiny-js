import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityContext } from "~/types";
import { Response } from "@webiny/handler-graphql";

type Context = SecurityContext & TenancyContext;

export default () => {
    return new GraphQLSchemaPlugin<Context>({
        typeDefs: /* GraphQL */ `
            type TenantResponse {
                data: Tenant
                error: TenancyError
            }

            extend type TenancyQuery {
                getDefaultTenant: TenantResponse
            }
        `,
        resolvers: {
            TenancyQuery: {
                async getDefaultTenant(_, args, { security, tenancy }) {
                    const identity = security.getIdentity();

                    const links = await security.listTenantLinksByIdentity({
                        identity: identity.id
                    });

                    // We need to find the oldest link, and that's our "default" tenant.
                    links.sort(
                        (a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()
                    );

                    const { tenant } = links[0];
                    return new Response(await tenancy.getTenantById(tenant));
                }
            }
        }
    });
};
