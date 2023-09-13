import { ListErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { SecurityContext } from "~/types";

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        type SecurityIdentityProfile {
            id: ID
            type: String
            displayName: String
        }

        type SecurityIdentityProfileListResponse {
            data: [SecurityIdentityProfile]
            error: SecurityError
        }

        extend type SecurityQuery {
            listIdentityProfiles: SecurityIdentityProfileListResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            listIdentityProfiles: async (_, __, context) => {
                try {
                    const identityProfileList = await context.security.listTenantLinksByTenant({
                        tenant: context.tenancy.getCurrentTenant().id,
                    });

                    const profiles = identityProfileList.map(item => {
                        return item.data.profile;
                    });

                    return new ListResponse(profiles);
                } catch (e) {
                    return new ListErrorResponse(e);
                }
            }
        }
    }
});
