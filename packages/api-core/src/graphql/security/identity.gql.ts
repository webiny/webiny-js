import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import type { ApiCoreContext } from "~/types/core.js";
import { AfterLoginEvent } from "~/features/security/login/index.js";
import { GetIdentityProfileUseCase } from "~/features/users/GetIdentityProfile/index.js";
import type { SecurityContext } from "~/types/security.js";
import type { AdminUser } from "~/types/users.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { ProfileMapper } from "./ProfileMapper.js";

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
        type SecurityIdentityTenant {
            id: ID!
            name: String!
        }
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
            currentTenant: SecurityIdentityTenant!
            defaultTenant: SecurityIdentityTenant!
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
        SecurityMutation: {
            login: async (_, __, context) => {
                const identityContext = context.container.resolve(IdentityContext);
                const identity = identityContext.getIdentity();
                if (identity.isAnonymous()) {
                    return new ErrorResponse({
                        code: "Security/Identity/NotAuthenticated",
                        message: "Unauthenticated!"
                    });
                }

                try {
                    const eventPublisher = context.container.resolve(EventPublisher);
                    await eventPublisher.publish(new AfterLoginEvent({ identity }));
                } catch (err) {
                    return new ErrorResponse(err);
                }

                // Roles and teams are stored in the user record.
                const rolesRepo = context.container.resolve(RolesRepository);
                const teamsRepo = context.container.resolve(TeamsRepository);
                const getProfile = context.container.resolve(GetIdentityProfileUseCase);

                const result = await context.security.withoutAuthorization(async () => {
                    return getProfile.execute(identity.id);
                });

                if (result.isFail()) {
                    return new ErrorResponse({
                        code: "Security/Identity/NotAuthorized",
                        message: "Missing user profile!"
                    });
                }

                const user = result.value;

                const [roles, teams] = await Promise.all([
                    getRoles(user, rolesRepo),
                    getTeams(user, teamsRepo)
                ]);

                const profileMapper = new ProfileMapper();
                const profile = await profileMapper.toDTO(user);

                return new Response({
                    ...identity.toJson(),
                    profile,
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
            permissions(_, __, context) {
                return context.security.listPermissions();
            }
        }
    }
});

const getRoles = async (user: AdminUser, rolesRepo: RolesRepository.Interface) => {
    const roleIds = user.roles ?? [];
    if (roleIds.length > 0) {
        const result = await rolesRepo.list({
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

const getTeams = async (user: AdminUser, teamsRepo: TeamsRepository.Interface) => {
    const teamIds = user.teams ?? [];
    if (teamIds.length > 0) {
        const result = await teamsRepo.list({
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
