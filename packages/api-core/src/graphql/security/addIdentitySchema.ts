import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { AfterLoginEvent } from "~/features/security/login/index.js";
import { GetIdentityProfileUseCase } from "~/features/users/GetIdentityProfile/index.js";
import type { AdminUser } from "~/types/users.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { ProfileMapper } from "./ProfileMapper.js";

const getDefaultTenant = async (
    identityContext: IdentityContext.Interface,
    getTenantById: GetTenantByIdUseCase.Interface,
    getRootTenant: GetRootTenantUseCase.Interface
) => {
    const identity = identityContext.getIdentity();
    const defaultTenantId = identity.context.defaultTenantId ?? "root";

    const tenantResult = await getTenantById.execute(defaultTenantId);
    if (tenantResult.isOk()) {
        return tenantResult.value;
    }

    const rootResult = await getRootTenant.execute();
    if (rootResult.isFail()) {
        throw rootResult.error;
    }
    return rootResult.value;
};

export const addIdentitySchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
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
    `);

    builder.addResolver({
        path: "SecurityMutation.login",
        dependencies: [
            IdentityContext,
            EventPublisher,
            RolesRepository,
            TeamsRepository,
            GetIdentityProfileUseCase
        ],
        resolver:
            (
                identityContext: IdentityContext.Interface,
                eventPublisher: EventPublisher.Interface,
                rolesRepo: RolesRepository.Interface,
                teamsRepo: TeamsRepository.Interface,
                getProfile: GetIdentityProfileUseCase.Interface
            ) =>
            async () => {
                const identity = identityContext.getIdentity();
                if (identity.isAnonymous()) {
                    return new ErrorResponse({
                        code: "Security/Identity/NotAuthenticated",
                        message: "Unauthenticated!"
                    });
                }

                try {
                    await eventPublisher.publish(new AfterLoginEvent({ identity }));
                } catch (err) {
                    return new ErrorResponse(err);
                }

                const result = await identityContext.withoutAuthorization(async () => {
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
    });

    builder.addResolver({
        path: "SecurityIdentity.defaultTenant",
        dependencies: [IdentityContext, GetTenantByIdUseCase, GetRootTenantUseCase],
        resolver:
            (
                identityContext: IdentityContext.Interface,
                getTenantById: GetTenantByIdUseCase.Interface,
                getRootTenant: GetRootTenantUseCase.Interface
            ) =>
            () =>
                getDefaultTenant(identityContext, getTenantById, getRootTenant)
    });

    builder.addResolver({
        path: "SecurityIdentity.currentTenant",
        dependencies: [TenantContext],
        resolver: (tenantContext: TenantContext.Interface) => () => tenantContext.getTenant()
    });

    builder.addResolver({
        path: "SecurityIdentity.permissions",
        dependencies: [IdentityContext],
        resolver: (identityContext: IdentityContext.Interface) => () =>
            identityContext.listPermissions()
    });
};

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
