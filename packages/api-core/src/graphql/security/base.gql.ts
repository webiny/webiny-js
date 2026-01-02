import { Response, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import type { SecurityContext } from "~/types/security.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { ListGroupsUseCase } from "~/features/security/groups/ListGroups/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { ProfileMapper } from "~/graphql/security/ProfileMapper.js";

const emptyResolver = () => ({});

const getDefaultTenant = async (context: SecurityContext) => {
    const identity = context.security.getIdentity();
    const defaultTenantId = identity.context.defaultTenantId ?? "root";

    const defaultTenant = await context.tenancy.getTenantById(defaultTenantId);
    if (defaultTenant) {
        return defaultTenant;
    }

    return context.tenancy.getRootTenant();
};

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        type SecurityIdentityProfileGroup {
            id: String!
            slug: String!
            name: String!
        }

        type SecurityIdentityProfileTeam {
            id: String!
            slug: String!
            name: String!
        }

        type SecurityIdentityProfile {
            groups: [SecurityIdentityProfileGroup!]!
            teams: [SecurityIdentityProfileTeam!]!
            firstName: String
            lastName: String
            email: String
            avatar: JSON
            external: Boolean!
            createdOn: DateTime!
        }

        type SecurityIdentity {
            id: ID!
            type: String!
            displayName: String!
            profile: SecurityIdentityProfile!
            permissions: [JSON!]!
            currentTenant: Tenant!
            defaultTenant: Tenant!
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
            },
            async profile(identity, _, context) {
                // TODO: refactor this resolver into a proper class with dependencies.
                const tenantContext = context.container.resolve(TenantContext);
                const getTenantUseCase = context.container.resolve(GetTenantByIdUseCase);
                const getUserUseCase = context.container.resolve(GetUserUseCase);
                const listGroupsUseCase = context.container.resolve(ListGroupsUseCase);
                const listTeamsUseCase = context.container.resolve(ListTeamsUseCase);

                const profileMapper = new ProfileMapper(listGroupsUseCase, listTeamsUseCase);

                const adminUser = await context.security.withoutAuthorization(async () => {
                    return getUserUseCase.execute({ id: identity.id });
                });

                if (adminUser.isOk()) {
                    return profileMapper.toDTO(adminUser.value);
                }

                // TODO: `parent` tenant resolution should be a decorator of the base resolver.
                // We must also consider an option where we have multi-tenancy, and current identity is
                // a "parent" tenant user, so naturally, his user profile lives in his original tenant.
                const tenant = context.tenancy.getCurrentTenant();

                const parentTenantUser = await context.security.withoutAuthorization(async () => {
                    if (!tenant.parent) {
                        return null;
                    }

                    const parentTenantResult = await getTenantUseCase.execute(tenant.parent);

                    return tenantContext.withTenant(parentTenantResult.value, () => {
                        return getUserUseCase.execute({ id: identity.id });
                    });
                });

                if (parentTenantUser && parentTenantUser.isOk()) {
                    return profileMapper.toDTO(parentTenantUser.value);
                }

                return {};
            }
        }
    }
});
