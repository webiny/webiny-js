/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
/**
 * Package deep-equal does not have types.
 */
// @ts-ignore
import deepEqual from "deep-equal";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { GetTeamParams, Team, TeamInput, TeamTenantLink, Security } from "~/types";
import NotAuthorizedError from "../NotAuthorizedError";
import { SecurityConfig } from "~/types";
import { mergeSecurityGroupsPermissions } from "~/createSecurity/mergeSecurityPermissions";

const CreateDataModel = withFields({
    tenant: string({ validation: validation.create("required") }),
    name: string({ validation: validation.create("required,minLength:3") }),
    slug: string({ validation: validation.create("required,minLength:3") }),
    description: string({ validation: validation.create("maxLength:500") }),
    groups: string({
        list: true,
        validation: validation.create("required")
    })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:3") }),
    description: string({ validation: validation.create("maxLength:500") }),
    groups: string({ list: true })
})();

async function checkPermission(security: Security): Promise<void> {
    const permission = await security.getPermission("security.team");

    if (!permission) {
        throw new NotAuthorizedError();
    }
}

async function updateTenantLinks(security: Security, tenant: string, team: Team): Promise<void> {
    const links = await security.listTenantLinksByType<TeamTenantLink>({
        tenant,
        type: "permissions"
    });

    if (!links.length) {
        return;
    }

    const teamGroups = await security.listGroups({ where: { id_in: team.groups } });
    const permissions = mergeSecurityGroupsPermissions(teamGroups);

    await security.updateTenantLinks(
        links
            .filter(link => link.data && link.data.team === team.id)
            .map(link => ({
                ...link,
                data: {
                    ...link.data,
                    team: {
                        id: team.id,
                        permissions
                    }
                }
            }))
    );
}

export const createTeamsMethods = ({
    getTenant: initialGetTenant,
    storageOperations
}: SecurityConfig) => {
    const getTenant = () => {
        const tenant = initialGetTenant();
        if (!tenant) {
            throw new WebinyError("Missing tenant.");
        }
        return tenant;
    };
    return {
        async getTeam(this: Security, { where }: GetTeamParams): Promise<Team> {
            await checkPermission(this);

            let team: Team | null = null;
            try {
                team = await storageOperations.getTeam({
                    where: { ...where, tenant: where.tenant || getTenant() }
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get team.",
                    ex.code || "GET_TEAM_ERROR",
                    where
                );
            }
            if (!team) {
                throw new NotFoundError(`Unable to find team : ${JSON.stringify(where)}`);
            }
            return team;
        },

        async listTeams(this: Security) {
            await checkPermission(this);
            try {
                return await storageOperations.listTeams({
                    where: {
                        tenant: getTenant()
                    },
                    sort: ["createdOn_ASC"]
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list API keys.",
                    ex.code || "LIST_API_KEY_ERROR"
                );
            }
        },

        async createTeam(this: Security, input: TeamInput): Promise<Team> {
            await checkPermission(this);

            const identity = this.getIdentity();
            const currentTenant = getTenant();

            await new CreateDataModel().populate({ ...input, tenant: currentTenant }).validate();

            const existing = await storageOperations.getTeam({
                where: {
                    tenant: currentTenant,
                    slug: input.slug
                }
            });

            if (existing) {
                throw new WebinyError(
                    `Team with slug "${input.slug}" already exists.`,
                    "TEAM_EXISTS"
                );
            }

            const team: Team = {
                id: mdbid(),
                tenant: currentTenant,
                ...input,
                system: input.system === true,
                webinyVersion: process.env.WEBINY_VERSION as string,
                createdOn: new Date().toISOString(),
                createdBy: identity
                    ? {
                          id: identity.id,
                          displayName: identity.displayName,
                          type: identity.type
                      }
                    : null
            };

            try {
                return await storageOperations.createTeam({ team });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create team.",
                    ex.code || "CREATE_TEAM_ERROR",
                    {
                        team
                    }
                );
            }
        },

        async updateTeam(this: Security, id: string, input: Record<string, any>): Promise<Team> {
            await checkPermission(this);

            const model = await new UpdateDataModel().populate(input);
            await model.validate();

            const original = await storageOperations.getTeam({
                where: { tenant: getTenant(), id }
            });
            if (!original) {
                throw new NotFoundError(`Team "${id}" was not found!`);
            }

            const data = await model.toJSON({ onlyDirty: true });

            const groupsChanged = !deepEqual(data.groups, original.groups);

            const team: Team = {
                ...original,
                ...data
            };
            try {
                const result = await storageOperations.updateTeam({ original, team });
                if (groupsChanged) {
                    await updateTenantLinks(this, getTenant(), result);
                }
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update team.",
                    ex.code || "UPDATE_TEAM_ERROR",
                    {
                        team
                    }
                );
            }
        },

        async deleteTeam(this: Security, id: string): Promise<void> {
            await checkPermission(this);

            const team = await storageOperations.getTeam({ where: { tenant: getTenant(), id } });
            if (!team) {
                throw new NotFoundError(`Team "${id}" was not found!`);
            }
            try {
                await storageOperations.deleteTeam({ team });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete team.",
                    ex.code || "DELETE_TEAM_ERROR",
                    {
                        team
                    }
                );
            }
        }
    };
};
