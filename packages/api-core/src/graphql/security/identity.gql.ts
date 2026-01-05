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
import type { SecurityContext } from "~/types/security.js";
import type { AdminUser } from "~/types/users.js";

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
                if (identity.isAnonymous()) {
                    return new ErrorResponse({
                        code: "NOT_AUTHENTICATED",
                        message: "Unauthenticated!"
                    });
                }

                // Roles and teams are stored in the user record.
                const getUser = context.container.resolve(GetUserUseCase);
                const listRoles = context.container.resolve(ListRolesUseCase);
                const listTeams = context.container.resolve(ListTeamsUseCase);

                const adminUserResult = await getUser.execute({ id: identity.id });

                if (!adminUserResult) {
                    return new ErrorResponse({
                        code: "NOT_AUTHENTICATED",
                        message: "Missing user profile!"
                    });
                }

                const user = adminUserResult.value;

                const [roles, teams] = await Promise.all([
                    getRoles(user, listRoles),
                    getTeams(user, listTeams)
                ]);

                try {
                    const eventPublisher = context.container.resolve(EventPublisher);
                    await eventPublisher.publish(new AfterLoginEvent({ identity }));
                } catch (err) {
                    return new ErrorResponse(err);
                }
                return new Response({
                    ...identity.toJson(),
                    roles,
                    teams
                });
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

const getRoles = async (user: AdminUser, listRoles: ListRolesUseCase.Interface) => {
    const roleIds = user.roles ?? [];
    if (roleIds.length > 0) {
        const result = await listRoles.execute({
            where: { id_in: roleIds }
        });

        if (result.isOk()) {
            return result.value.map(role => ({
                id: role.id,
                slug: role.slug,
                name: role.name
            }));
        }
    }

    return [];
};

const getTeams = async (user: AdminUser, listTeams: ListTeamsUseCase.Interface) => {
    const teamIds = user.teams ?? [];
    if (teamIds.length > 0) {
        const result = await listTeams.execute({
            where: { id_in: teamIds }
        });
        if (result.isOk()) {
            return result.value.map(team => ({
                id: team.id,
                slug: team.slug,
                name: team.name
            }));
        }
    }
    return [];
};
