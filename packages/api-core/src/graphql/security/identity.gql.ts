import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import type { ApiCoreContext } from "~/types/core.js";
import { AfterLoginEvent } from "~/features/security/login/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { ProfileMapper } from "~/graphql/security/ProfileMapper.js";
import { Identity } from "~/features/security/IdentityContext/index.js";
import type { SecurityContext } from "~/types/security.js";

const getDefaultTenant = async (context: SecurityContext) => {
    const identity = context.security.getIdentity();
    const defaultTenantId = identity.context.defaultTenantId ?? "root";

    const defaultTenant = await context.tenancy.getTenantById(defaultTenantId);
    if (defaultTenant) {
        return defaultTenant;
    }

    return context.tenancy.getRootTenant();
};

export default new GraphQLSchemaPlugin<ApiCoreContext>({
    typeDefs: /* GraphQL */ `
        type SecurityIdentityProfileRole {
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
            roles: [SecurityIdentityProfileRole!]!
            teams: [SecurityIdentityProfileTeam!]!
            permissions: [JSON!]!
            profile: SecurityIdentityProfile!
            currentTenant: Tenant!
            defaultTenant: Tenant!
        }

        type SecurityIdentityLoginResponse {
            data: SecurityIdentity
            error: SecurityError
        }

        extend type SecurityMutation {
            "Login using idToken obtained from a 3rd party identity provider"
            login: SecurityIdentityLoginResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            async getDefaultTenant(_, __, context) {
                return new Response(getDefaultTenant(context));
            }
        },
        SecurityMutation: {
            login: async (_, __, context) => {
                const identity = context.security.getIdentity();
                if (identity) {
                    try {
                        const eventPublisher = context.container.resolve(EventPublisher);
                        await eventPublisher.publish(new AfterLoginEvent({ identity }));
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                }
                return new Response(identity.toJson());
            }
        },
        SecurityIdentity: {
            defaultTenant(_, __, context) {
                return getDefaultTenant(context);
            },
            currentTenant(_, __, context) {
                return context.tenancy.getCurrentTenant();
            },
            async roles(identity: Identity, _, context) {
                const listRolesUseCase = context.container.resolve(ListRolesUseCase);

                const roleIds = identity.roles ?? [];
                if (roleIds.length > 0) {
                    const listRoles = await listRolesUseCase.execute({
                        where: { id_in: roleIds }
                    });

                    if (listRoles.isOk()) {
                        return listRoles.value.map(role => ({
                            id: role.id,
                            slug: role.slug,
                            name: role.name
                        }));
                    }
                }

                return [];
            },
            async teams(identity: Identity, _, context) {
                const listTeamsUseCase = context.container.resolve(ListTeamsUseCase);

                const teamIds = identity.teams ?? [];
                if (teamIds.length > 0) {
                    const listTeamsResult = await listTeamsUseCase.execute({
                        where: { id_in: teamIds }
                    });
                    if (listTeamsResult.isOk()) {
                        return listTeamsResult.value.map(team => ({
                            id: team.id,
                            slug: team.slug,
                            name: team.name
                        }));
                    }
                }
                return [];
            },
            async profile(identity, _, context) {
                // TODO: refactor this resolver into a proper class with dependencies.
                const tenantContext = context.container.resolve(TenantContext);
                const getTenantUseCase = context.container.resolve(GetTenantByIdUseCase);
                const getUserUseCase = context.container.resolve(GetUserUseCase);

                const profileMapper = new ProfileMapper();

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
            },
            permissions(_, __, context) {
                return context.security.listPermissions();
            }
        }
    }
});
