import { Response, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { getDefaultTenant as baseGetDefaultTenant } from "~/features/security/utils/getDefaultTenant.js";
import type { SecurityContext } from "~/types/security.js";

const emptyResolver = () => ({});

const getDefaultTenant = async (context: SecurityContext) => {
    const defaultTenant = await baseGetDefaultTenant(context);
    if (defaultTenant) {
        return defaultTenant;
    }

    return context.tenancy.getRootTenant();
};

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        interface SecurityIdentity {
            id: ID!
            type: String!
            displayName: String!
            permissions: [JSON!]!
            currentTenant: Tenant
            defaultTenant: Tenant
        }

        type TenantResponse {
            data: Tenant
            error: SecurityError
        }

        type SecurityQuery {
            getDefaultTenant: TenantResponse
        }

        type SecurityMutation {
            _empty: String
        }

        extend type Query {
            security: SecurityQuery
        }

        extend type Mutation {
            security: SecurityMutation
        }

        type SecurityCreatedBy {
            id: ID
            displayName: String
        }

        type SecurityError {
            code: String
            message: String
            data: JSON
            stack: String
        }

        type SecurityBooleanResponse {
            data: Boolean
            error: SecurityError
        }
    `,
    resolvers: {
        Query: {
            security: emptyResolver
        },
        Mutation: {
            security: emptyResolver
        },
        SecurityQuery: {
            async getDefaultTenant(_, __, context) {
                return new Response(getDefaultTenant(context));
            }
        },
        SecurityIdentity: {
            defaultTenant(_, __, context) {
                return getDefaultTenant(context);
            },
            currentTenant(_, __, context) {
                return context.tenancy.getCurrentTenant();
            }
        }
    }
});
