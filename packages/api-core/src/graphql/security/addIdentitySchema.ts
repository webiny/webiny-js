import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse, Response } from "@webiny/api-graphql";
import { LogInUseCase } from "~/features/security/login/index.js";
import { ResolveIdentityTenantsUseCase } from "~/features/security/ResolveIdentityTenants/index.js";
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
            "The enabled tenants in which the identity has a user record, sorted by name."
            tenants: [SecurityIdentityTenant!]!
        }

        "The identity has no user record in this tenant, but has one in these tenants."
        type SecurityLoginTenantSelection {
            tenants: [SecurityIdentityTenant!]!
        }

        union SecurityLoginResult = SecurityIdentity | SecurityLoginTenantSelection

        type SecurityIdentityLoginResponse {
            data: SecurityLoginResult
            error: SecurityError
        }

        extend type SecurityMutation {
            "Login using idToken obtained from a 3rd party identity provider"
            login: SecurityIdentityLoginResponse
        }
    `);

    builder.addResolver({
        path: "SecurityMutation.login",
        dependencies: [LogInUseCase, RolesRepository, TeamsRepository],
        resolver:
            (
                logIn: LogInUseCase.Interface,
                rolesRepo: RolesRepository.Interface,
                teamsRepo: TeamsRepository.Interface
            ) =>
            async () => {
                let result: Awaited<LogInUseCase.Return>;
                try {
                    result = await logIn.execute();
                } catch (err) {
                    // AfterLogin handlers report failures by throwing.
                    return new ErrorResponse(err);
                }

                if (result.isFail()) {
                    return new ErrorResponse(result.error);
                }

                if (result.value.type === "tenantSelectionRequired") {
                    return new Response({
                        __typename: "SecurityLoginTenantSelection",
                        tenants: result.value.tenants
                    });
                }

                // Roles and teams are stored in the user record.
                const { identity, user } = result.value;

                const [roles, teams] = await Promise.all([
                    getRoles(user, rolesRepo),
                    getTeams(user, teamsRepo)
                ]);

                const profileMapper = new ProfileMapper();
                const profile = await profileMapper.toDTO(user);

                return new Response({
                    __typename: "SecurityIdentity",
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

    builder.addResolver({
        path: "SecurityIdentity.tenants",
        dependencies: [IdentityContext, ResolveIdentityTenantsUseCase],
        resolver:
            (
                identityContext: IdentityContext.Interface,
                resolveIdentityTenants: ResolveIdentityTenantsUseCase.Interface
            ) =>
            async ({ parent }: { parent: { id: string } }) => {
                const result = await identityContext.withoutAuthorization(() => {
                    return resolveIdentityTenants.execute(parent.id);
                });

                // The list only drives tenant switching, so a failed lookup doesn't fail the login.
                return result.isOk() ? result.value : [];
            }
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
