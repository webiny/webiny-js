import type { SecurityStorageParams } from "./types.js";
import { ENTITIES } from "./types.js";
import type {
    ApiKey,
    Role,
    SecurityStorageOperations,
    Team
} from "@webiny/api-core/types/security.js";
import WebinyError from "@webiny/error";
import { createTable } from "./definitions/table.js";
import { createApiKeyEntity, createRoleEntity, createTeamEntity } from "./definitions/entities.js";
import type { QueryOneParams } from "@webiny/db-dynamodb";
import {
    cleanupItem,
    cleanupItems,
    deleteItem,
    getClean,
    put,
    queryAll,
    queryOneClean,
    sortItems
} from "@webiny/db-dynamodb";

const reservedFields: string[] = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (!reservedFields.includes(name)) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createStorageOperations = (
    params: SecurityStorageParams
): SecurityStorageOperations => {
    const { table: tableName, documentClient, attributes } = params;
    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const table = createTable({ table: tableName, documentClient });

    const entities = {
        apiKeys: createApiKeyEntity(table, attributes ? attributes[ENTITIES.API_KEY] : {}),
        roles: createRoleEntity(table, attributes ? attributes[ENTITIES.GROUP] : {}),
        teams: createTeamEntity(table, attributes ? attributes[ENTITIES.TEAM] : {})
    };

    const createApiKeyKeys = ({ id, tenant }: Pick<ApiKey, "id" | "tenant">) => ({
        PK: `T#${tenant}#API_KEY#${id}`,
        SK: `A`
    });

    const createRoleKeys = (role: Pick<Role, "tenant" | "id">) => ({
        PK: `T#${role.tenant}#GROUP#${role.id}`,
        SK: `A`
    });

    const createRoleGsiKeys = (role: Pick<Role, "tenant" | "slug">) => ({
        GSI1_PK: `T#${role.tenant}#GROUPS`,
        GSI1_SK: role.slug
    });

    const createTeamKeys = (team: Pick<Team, "tenant" | "id">) => ({
        PK: `T#${team.tenant}#TEAM#${team.id}`,
        SK: `A`
    });

    const createTeamGsiKeys = (team: Pick<Team, "tenant" | "slug">) => ({
        GSI1_PK: `T#${team.tenant}#TEAMS`,
        GSI1_SK: team.slug
    });

    return {
        async createApiKey({ apiKey }): Promise<void> {
            const keys = {
                ...createApiKeyKeys(apiKey),
                GSI1_PK: `T#${apiKey.tenant}#API_KEYS`,
                GSI1_SK: apiKey.token
            };

            try {
                await put({
                    entity: entities.apiKeys,
                    item: {
                        ...cleanupItem(entities.apiKeys, apiKey),
                        TYPE: "security.apiKey",
                        ...keys
                    }
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
                await put({
                    entity: entities.roles,
                    item: {
                        ...cleanupItem(entities.roles, role),
                        TYPE: "security.role",
                        ...keys
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create role.",
                    code: "CREATE_GROUP_ERROR",
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
                await put({
                    entity: entities.teams,
                    item: {
                        ...cleanupItem(entities.teams, team),
                        TYPE: "security.team",
                        ...keys
                    }
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
                await deleteItem({
                    entity: entities.apiKeys,
                    keys
                });
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
                await deleteItem({
                    entity: entities.roles,
                    keys
                });
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
                await deleteItem({
                    entity: entities.teams,
                    keys
                });
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
                return await getClean<ApiKey>({
                    entity: entities.apiKeys,
                    keys
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key.",
                    code: "GET_API_KEY_ERROR",
                    data: { id, keys }
                });
            }
        },
        async getApiKeyByToken({ tenant, token }) {
            const queryParams: QueryOneParams = {
                entity: entities.apiKeys,
                partitionKey: `T#${tenant}#API_KEYS`,
                options: {
                    eq: token,
                    index: "GSI1"
                }
            };

            try {
                return await queryOneClean<ApiKey>(queryParams);
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
                    return await getClean<Role>({
                        entity: entities.roles,
                        keys: createRoleKeys({ tenant, id })
                    });
                }
                return await queryOneClean<Role>({
                    entity: entities.roles,
                    partitionKey: `T#${tenant}#GROUPS`,
                    options: {
                        index: "GSI1",
                        eq: slug
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load role.",
                    code: "GET_GROUP_ERROR",
                    data: { id, slug }
                });
            }
        },
        async getTeam({ where: { tenant, id, slug } }) {
            try {
                if (id) {
                    return await getClean<Team>({
                        entity: entities.teams,
                        keys: createTeamKeys({ tenant, id })
                    });
                }
                return await queryOneClean({
                    entity: entities.teams,
                    partitionKey: `T#${tenant}#TEAMS`,
                    options: {
                        index: "GSI1",
                        eq: slug
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load team.",
                    code: "GET_TEAM_ERROR",
                    data: { id, slug }
                });
            }
        },
        async listApiKeys({ where: { tenant }, sort }): Promise<ApiKey[]> {
            let items: ApiKey[] = [];
            try {
                items = await queryAll<ApiKey>({
                    entity: entities.apiKeys,
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

            const sortedItems = sortItems({
                items,
                sort,
                fields: []
            });
            return sortedItems
                .map(item => cleanupItem(entities.apiKeys, item))
                .filter(Boolean) as ApiKey[];
        },
        async listRoles({ where: { tenant, id_in, slug_in }, sort }): Promise<Role[]> {
            let items: Role[];
            try {
                items = await queryAll<Role>({
                    entity: entities.roles,
                    partitionKey: `T#${tenant}#GROUPS`,
                    options: {
                        index: "GSI1"
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list roles.",
                    code: "LIST_GROUP_ERROR"
                });
            }

            items = cleanupItems(
                entities.roles,
                sortItems({
                    items,
                    sort,
                    fields: []
                })
            );

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
                items = await queryAll<Team>({
                    entity: entities.teams,
                    partitionKey: `T#${tenant}#TEAMS`,
                    options: {
                        index: "GSI1"
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list teams.",
                    code: "LIST_TEAM_ERROR"
                });
            }

            items = cleanupItems(
                entities.teams,
                sortItems({
                    items,
                    sort,
                    fields: []
                })
            );

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
                await put({
                    entity: entities.apiKeys,
                    item: {
                        ...apiKey,
                        TYPE: "security.apiKey",
                        ...keys
                    }
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
                await put({
                    entity: entities.roles,
                    item: {
                        ...cleanupItem(entities.roles, role),
                        ...keys,
                        ...createRoleGsiKeys(role)
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update role.",
                    code: "UPDATE_GROUP_ERROR",
                    data: { keys, role }
                });
            }
        },
        async updateTeam({ team }): Promise<void> {
            const keys = createTeamKeys(team);

            try {
                await put({
                    entity: entities.teams,
                    item: {
                        ...cleanupItem(entities.teams, team),
                        ...keys,
                        ...createTeamGsiKeys(team)
                    }
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
