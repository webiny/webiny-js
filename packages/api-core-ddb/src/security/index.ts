import type { SecurityStorageParams } from "./types.js";
import type {
    ApiKey,
    Role,
    SecurityStorageOperations,
    Team
} from "@webiny/api-core/types/security.js";
import WebinyError from "@webiny/error";
import { createApiKeyEntity, createRoleEntity, createTeamEntity } from "./definitions/entities.js";
import { createTable, type IEntityQueryOneParams, sortItems } from "@webiny/db-dynamodb";

export const createStorageOperations = (
    params: SecurityStorageParams
): SecurityStorageOperations => {
    const { table: tableName, documentClient } = params;

    const table = createTable({
        name: tableName || (process.env.DB_TABLE as string),
        documentClient
    });

    const entities = {
        apiKeys: createApiKeyEntity(table.table),
        roles: createRoleEntity(table.table),
        teams: createTeamEntity(table.table)
    };

    const createApiKeyKeys = ({ id, tenant }: Pick<ApiKey, "id" | "tenant">) => ({
        PK: `T#${tenant}#API_KEY#${id}`,
        SK: `A`,
        GSI_TENANT: tenant,
        TYPE: "security.apiKey"
    });

    const createRoleKeys = (role: Pick<Role, "tenant" | "id">) => ({
        PK: `T#${role.tenant}#ROLE#${role.id}`,
        SK: `A`
    });

    const createRoleGsiKeys = (role: Pick<Role, "tenant" | "slug">) => ({
        GSI1_PK: `T#${role.tenant}#ROLES`,
        GSI1_SK: role.slug,
        GSI_TENANT: role.tenant as string,
        TYPE: "security.role"
    });

    const createTeamKeys = (team: Pick<Team, "tenant" | "id">) => ({
        PK: `T#${team.tenant}#TEAM#${team.id}`,
        SK: `A`
    });

    const createTeamGsiKeys = (team: Pick<Team, "tenant" | "slug">) => ({
        GSI1_PK: `T#${team.tenant}#TEAMS`,
        GSI1_SK: team.slug,
        GSI_TENANT: team.tenant as string,
        TYPE: "security.team"
    });

    return {
        async createApiKey({ apiKey }): Promise<void> {
            const keys = {
                ...createApiKeyKeys(apiKey),
                GSI1_PK: `T#${apiKey.tenant}#API_KEYS`,
                GSI1_SK: apiKey.token
            };

            try {
                await entities.apiKeys.put({
                    data: apiKey,
                    ...keys
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create api key.",
                    code: "CREATE_API_KEY_ERROR",
                    data: { keys }
                });
            }
        },
        async createRole({ role }): Promise<void> {
            const keys = {
                ...createRoleKeys(role),
                ...createRoleGsiKeys(role)
            };

            try {
                await entities.roles.put({
                    data: role,
                    ...keys
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create role.",
                    code: "CREATE_ROLE_ERROR",
                    data: { keys }
                });
            }
        },
        async createTeam({ team }): Promise<void> {
            const keys = {
                ...createTeamKeys(team),
                ...createTeamGsiKeys(team)
            };

            try {
                await entities.teams.put({
                    data: team,
                    ...keys
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create team.",
                    code: "CREATE_TEAM_ERROR",
                    data: { keys }
                });
            }
        },
        async deleteApiKey({ apiKey }) {
            const keys = createApiKeyKeys(apiKey);

            try {
                await entities.apiKeys.delete(keys);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update api key.",
                    code: "UPDATE_API_KEY_ERROR",
                    data: { keys }
                });
            }
        },
        async deleteRole({ role }) {
            const keys = createRoleKeys(role);

            try {
                await entities.roles.delete(keys);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete role.",
                    code: "CREATE_DELETE_ERROR",
                    data: { keys, role }
                });
            }
        },
        async deleteTeam({ team }) {
            const keys = createTeamKeys(team);

            try {
                await entities.teams.delete(keys);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete team.",
                    code: "CREATE_DELETE_ERROR",
                    data: { keys, team }
                });
            }
        },
        async getApiKey({ id, tenant }) {
            const keys = createApiKeyKeys({ id, tenant });

            try {
                const response = await entities.apiKeys.get(keys);

                return response?.data || null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key.",
                    code: "GET_API_KEY_ERROR",
                    data: { id, keys }
                });
            }
        },
        async getApiKeyByToken({ tenant, token }) {
            const queryParams: IEntityQueryOneParams = {
                partitionKey: `T#${tenant}#API_KEYS`,
                options: {
                    eq: token,
                    index: "GSI1"
                }
            };

            try {
                const result = await entities.apiKeys.queryOne(queryParams);
                return result?.data || null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key by token.",
                    code: "GET_BY_TOKEN_API_KEY_ERROR",
                    data: { partitionKey: queryParams.partitionKey, options: queryParams.options }
                });
            }
        },
        async getRole({ where: { tenant, id, slug } }) {
            try {
                if (id) {
                    const result = await entities.roles.get(createRoleKeys({ tenant, id }));
                    return result?.data || null;
                }
                const result = await entities.roles.queryOne({
                    partitionKey: `T#${tenant}#ROLES`,
                    options: {
                        index: "GSI1",
                        eq: slug
                    }
                });

                return result?.data || null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load role.",
                    code: "GET_ROLE_ERROR",
                    data: { id, slug }
                });
            }
        },
        async getTeam({ where: { tenant, id, slug } }) {
            try {
                if (id) {
                    const result = await entities.teams.get(createTeamKeys({ tenant, id }));

                    return result?.data || null;
                }

                const result = await entities.teams.queryOne({
                    partitionKey: `T#${tenant}#TEAMS`,
                    options: {
                        index: "GSI1",
                        eq: slug
                    }
                });

                return result?.data || null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load team.",
                    code: "GET_TEAM_ERROR",
                    data: { id, slug }
                });
            }
        },
        async listApiKeys({ where: { tenant }, sort }): Promise<ApiKey[]> {
            let items;
            try {
                items = await entities.apiKeys.queryAll({
                    partitionKey: `T#${tenant}#API_KEYS`,
                    options: {
                        index: "GSI1"
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list api keys.",
                    code: "LIST_API_KEY_ERROR"
                });
            }

            return sortItems({ items, sort }).map(item => item.data);
        },
        async listRoles({ where: { tenant, id_in, slug_in }, sort }): Promise<Role[]> {
            let items: Role[];
            try {
                const ddbItems = await entities.roles.queryAll({
                    partitionKey: `T#${tenant}#ROLES`,
                    options: {
                        index: "GSI1"
                    }
                });
                items = ddbItems.map(item => item.data);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list roles.",
                    code: "LIST_ROLE_ERROR"
                });
            }

            items = sortItems({ items, sort });

            if (Array.isArray(id_in)) {
                return items.filter(item => id_in.includes(item.id));
            }

            if (Array.isArray(slug_in)) {
                return items.filter(item => slug_in.includes(item.slug));
            }

            return items;
        },
        async listTeams({ where: { tenant, id_in, slug_in }, sort }): Promise<Team[]> {
            let items: Team[];
            try {
                const ddbRecords = await entities.teams.queryAll({
                    partitionKey: `T#${tenant}#TEAMS`,
                    options: {
                        index: "GSI1"
                    }
                });

                items = ddbRecords.map(item => item.data);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list teams.",
                    code: "LIST_TEAM_ERROR"
                });
            }

            items = sortItems({ items, sort });

            if (Array.isArray(id_in)) {
                return items.filter(item => id_in.includes(item.id));
            }

            if (Array.isArray(slug_in)) {
                return items.filter(item => slug_in.includes(item.slug));
            }
            return items;
        },
        async updateApiKey({ apiKey }): Promise<void> {
            const keys = {
                ...createApiKeyKeys(apiKey),
                GSI1_PK: `T#${apiKey.tenant}#API_KEYS`,
                GSI1_SK: apiKey.token
            };

            try {
                await entities.apiKeys.put({
                    data: apiKey,
                    ...keys
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update api key.",
                    code: "UPDATE_API_KEY_ERROR",
                    data: { keys }
                });
            }
        },
        async updateRole({ role }): Promise<void> {
            const keys = createRoleKeys(role);

            try {
                await entities.roles.put({
                    data: role,
                    ...keys,
                    ...createRoleGsiKeys(role)
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update role.",
                    code: "UPDATE_ROLE_ERROR",
                    data: { keys, role }
                });
            }
        },
        async updateTeam({ team }): Promise<void> {
            const keys = createTeamKeys(team);

            try {
                await entities.teams.put({
                    data: team,
                    ...keys,
                    ...createTeamGsiKeys(team)
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update team.",
                    code: "UPDATE_TEAM_ERROR",
                    data: { keys, team }
                });
            }
        }
    };
};
