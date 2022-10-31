import { ENTITIES, SecurityStorageParams } from "~/types";
import {
    ApiKey,
    Group,
    Team,
    ListTenantLinksByTypeParams,
    SecurityStorageOperations,
    StorageOperationsGetTenantLinkByIdentityParams,
    System,
    TenantLink
} from "@webiny/api-security/types";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table";
import {
    createApiKeyEntity,
    createGroupEntity,
    createTeamEntity,
    createSystemEntity,
    createTenantLinkEntity
} from "~/definitions/entities";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, queryOne, QueryOneParams } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";

const reservedFields: string[] = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (reservedFields.includes(name) === false) {
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
        system: createSystemEntity(table, attributes ? attributes[ENTITIES.SYSTEM] : {}),
        groups: createGroupEntity(table, attributes ? attributes[ENTITIES.GROUP] : {}),
        teams: createTeamEntity(table, attributes ? attributes[ENTITIES.TEAM] : {}),
        tenantLinks: createTenantLinkEntity(
            table,
            attributes ? attributes[ENTITIES.TENANT_LINK] : {}
        )
    };

    const createApiKeyKeys = ({ id, tenant }: Pick<ApiKey, "id" | "tenant">) => ({
        PK: `T#${tenant}#API_KEY#${id}`,
        SK: `A`
    });

    const createGroupKeys = (group: Pick<Group, "tenant" | "id">) => ({
        PK: `T#${group.tenant}#GROUP#${group.id}`,
        SK: `A`
    });

    const createGroupGsiKeys = (group: Pick<Group, "tenant" | "slug">) => ({
        GSI1_PK: `T#${group.tenant}#GROUPS`,
        GSI1_SK: group.slug
    });

    const createTeamKeys = (team: Pick<Team, "tenant" | "id">) => ({
        PK: `T#${team.tenant}#TEAM#${team.id}`,
        SK: `A`
    });

    const createTeamGsiKeys = (team: Pick<Team, "tenant" | "slug">) => ({
        GSI1_PK: `T#${team.tenant}#TEAMS`,
        GSI1_SK: team.slug
    });

    const createSystemKeys = (tenant: string) => ({
        PK: `T#${tenant}#SYSTEM`,
        SK: "SECURITY"
    });

    return {
        async createApiKey({ apiKey }): Promise<ApiKey> {
            const keys = {
                ...createApiKeyKeys(apiKey),
                GSI1_PK: `T#${apiKey.tenant}#API_KEYS`,
                GSI1_SK: apiKey.token
            };

            try {
                await entities.apiKeys.put({
                    ...cleanupItem(entities.apiKeys, apiKey),
                    TYPE: "security.apiKey",
                    ...keys
                });
                return apiKey;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create api key.",
                    code: "CREATE_API_KEY_ERROR",
                    data: { keys }
                });
            }
        },
        async createGroup({ group }): Promise<Group> {
            const keys = {
                ...createGroupKeys(group),
                ...createGroupGsiKeys(group)
            };

            try {
                await entities.groups.put({
                    ...cleanupItem(entities.groups, group),
                    TYPE: "security.group",
                    ...keys
                });
                return group;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create group.",
                    code: "CREATE_GROUP_ERROR",
                    data: { keys }
                });
            }
        },
        async createTeam({ team }): Promise<Team> {
            const keys = {
                ...createTeamKeys(team),
                ...createTeamGsiKeys(team)
            };

            try {
                await entities.teams.put({
                    ...cleanupItem(entities.teams, team),
                    TYPE: "security.team",
                    ...keys
                });
                return team;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create team.",
                    code: "CREATE_TEAM_ERROR",
                    data: { keys }
                });
            }
        },
        async createSystemData({ system }): Promise<System> {
            const keys = createSystemKeys(system.tenant);
            try {
                await entities.system.put({
                    ...keys,
                    ...cleanupItem(entities.system, system)
                });
                return system;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create system.",
                    code: "CREATE_SYSTEM_ERROR",
                    data: { keys, system }
                });
            }
        },
        async createTenantLinks(links): Promise<void> {
            const items = links.map(link => {
                return entities.tenantLinks.putBatch({
                    PK: `IDENTITY#${link.identity}`,
                    SK: `LINK#T#${link.tenant}`,
                    GSI1_PK: `T#${link.tenant}`,
                    GSI1_SK: `TYPE#${link.type}#IDENTITY#${link.identity}`,
                    ...cleanupItem(entities.tenantLinks, link)
                });
            });

            await batchWriteAll({ table, items });
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
        async deleteGroup({ group }) {
            const keys = createGroupKeys(group);

            try {
                await entities.groups.delete(keys);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete group.",
                    code: "CREATE_DELETE_ERROR",
                    data: { keys, group }
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
        async deleteTenantLinks(links): Promise<void> {
            const items = links.map(link => {
                return entities.tenantLinks.deleteBatch({
                    PK: `IDENTITY#${link.identity}`,
                    SK: `LINK#T#${link.tenant}`
                });
            });

            await batchWriteAll({ table, items });
        },
        async getApiKey({ id, tenant }) {
            const keys = createApiKeyKeys({ id, tenant });

            try {
                const result = await entities.apiKeys.get(keys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entities.apiKeys, result.Item);
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
                const result = await queryOne<ApiKey>(queryParams);
                return cleanupItem(entities.apiKeys, result);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key by token.",
                    code: "GET_BY_TOKEN_API_KEY_ERROR",
                    data: { partitionKey: queryParams.partitionKey, options: queryParams.options }
                });
            }
        },
        async getGroup({ where: { tenant, id, slug } }): Promise<Group> {
            try {
                let result;
                if (id) {
                    const response = await entities.groups.get(createGroupKeys({ tenant, id }));
                    if (response.Item) {
                        result = response.Item;
                    }
                } else if (slug) {
                    result = await queryOne({
                        entity: entities.groups,
                        partitionKey: `T#${tenant}#GROUPS`,
                        options: {
                            index: "GSI1",
                            eq: slug
                        }
                    });
                }

                return cleanupItem(entities.groups, result);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load group.",
                    code: "GET_GROUP_ERROR",
                    data: { id, slug }
                });
            }
        },
        async getTeam({ where: { tenant, id, slug } }): Promise<Team> {
            try {
                let result;
                if (id) {
                    const response = await entities.teams.get(createTeamKeys({ tenant, id }));
                    if (response.Item) {
                        result = response.Item;
                    }
                } else if (slug) {
                    result = await queryOne({
                        entity: entities.teams,
                        partitionKey: `T#${tenant}#TEAMS`,
                        options: {
                            index: "GSI1",
                            eq: slug
                        }
                    });
                }

                return cleanupItem(entities.teams, result);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load team.",
                    code: "GET_TEAM_ERROR",
                    data: { id, slug }
                });
            }
        },
        async getSystemData({ tenant }): Promise<System | null> {
            const keys = createSystemKeys(tenant);
            try {
                const result = await entities.system.get(keys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entities.system, result.Item);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load system.",
                    code: "GET_SYSTEM_ERROR",
                    data: { keys }
                });
            }
        },
        async getTenantLinkByIdentity<TLink extends TenantLink = TenantLink>({
            tenant,
            identity
        }: StorageOperationsGetTenantLinkByIdentityParams): Promise<TLink | null> {
            try {
                const result = await queryOne<TLink>({
                    entity: entities.tenantLinks,
                    partitionKey: `IDENTITY#${identity}`,
                    options: {
                        eq: `LINK#T#${tenant}`
                    }
                });

                return cleanupItem(entities.tenantLinks, result);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not get tenant link for identity.",
                    code: "GET_TENANT_LINK_BY_IDENTITY",
                    data: { tenant, identity }
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
                        index: "GSI1",
                        beginsWith: ""
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
        async listGroups({ where: { tenant, id_in }, sort }): Promise<Group[]> {
            let items: Group[];
            try {
                items = await queryAll<Group>({
                    entity: entities.groups,
                    partitionKey: `T#${tenant}#GROUPS`,
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list groups.",
                    code: "LIST_GROUP_ERROR"
                });
            }

            items = cleanupItems(
                entities.groups,
                sortItems({
                    items,
                    sort,
                    fields: []
                })
            );

            // TODO: check with Bruno
            if (Array.isArray(id_in)) {
                return items.filter(item => id_in.includes(item.id));
            }

            return items;
        },
        async listTeams({ where: { tenant }, sort }): Promise<Team[]> {
            let items: Team[];
            try {
                items = await queryAll<Team>({
                    entity: entities.teams,
                    partitionKey: `T#${tenant}#TEAMS`,
                    options: {
                        index: "GSI1",
                        beginsWith: ""
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list teams.",
                    code: "LIST_TEAM_ERROR"
                });
            }

            return cleanupItems(
                entities.teams,
                sortItems({
                    items,
                    sort,
                    fields: []
                })
            );
        },
        async listTenantLinksByIdentity({ identity }): Promise<TenantLink[]> {
            const links = await queryAll<TenantLink>({
                entity: entities.tenantLinks,
                partitionKey: `IDENTITY#${identity}`,
                options: { beginsWith: "LINK#" }
            });

            return cleanupItems(entities.tenantLinks, links);
        },
        async listTenantLinksByTenant({ tenant }): Promise<TenantLink[]> {
            const links = await queryAll<TenantLink>({
                entity: entities.tenantLinks,
                partitionKey: `T#${tenant}`,
                options: { index: "GSI1", beginsWith: "" }
            });

            return cleanupItems(entities.tenantLinks, links);
        },
        async listTenantLinksByType<TLink = TenantLink>({
            type,
            tenant
        }: ListTenantLinksByTypeParams): Promise<TLink[]> {
            const links = await queryAll<TLink>({
                entity: entities.tenantLinks,
                partitionKey: `T#${tenant}`,
                options: { index: "GSI1", beginsWith: `TYPE#${type}#` }
            });

            return cleanupItems(entities.tenantLinks, links);
        },
        async updateApiKey({ apiKey }): Promise<ApiKey> {
            const keys = {
                ...createApiKeyKeys(apiKey),
                GSI1_PK: `T#${apiKey.tenant}#API_KEYS`,
                GSI1_SK: apiKey.token
            };

            try {
                await entities.apiKeys.put({
                    ...apiKey,
                    TYPE: "security.apiKey",
                    ...keys
                });
                return apiKey;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update api key.",
                    code: "UPDATE_API_KEY_ERROR",
                    data: { keys }
                });
            }
        },
        async updateGroup({ group }): Promise<Group> {
            const keys = createGroupKeys(group);

            try {
                await entities.groups.put({
                    ...cleanupItem(entities.groups, group),
                    ...keys,
                    ...createGroupGsiKeys(group)
                });
                return group;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update group.",
                    code: "UPDATE_GROUP_ERROR",
                    data: { keys, group }
                });
            }
        },
        async updateTeam({ team }): Promise<Team> {
            const keys = createTeamKeys(team);

            console.log("doeo team", JSON.stringify(team, null, 2));
            try {
                await entities.teams.put({
                    ...cleanupItem(entities.teams, team),
                    ...keys,
                    ...createTeamGsiKeys(team)
                });
                return team;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update team.",
                    code: "UPDATE_TEAM_ERROR",
                    data: { keys, team }
                });
            }
        },
        async updateSystemData({ system, original }): Promise<System> {
            const keys = createSystemKeys(system.tenant);
            try {
                await entities.system.put({
                    ...keys,
                    ...cleanupItem(entities.system, system)
                });
                return system;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update system.",
                    code: "UPDATE_SYSTEM_ERROR",
                    data: { keys, system, original }
                });
            }
        },
        async updateTenantLinks(links): Promise<void> {
            const items = links.map(link => {
                return entities.tenantLinks.putBatch({
                    PK: `IDENTITY#${link.identity}`,
                    SK: `LINK#T#${link.tenant}`,
                    GSI1_PK: `T#${link.tenant}`,
                    GSI1_SK: `TYPE#${link.type}#IDENTITY#${link.identity}`,
                    ...cleanupItem(entities.tenantLinks, link)
                });
            });

            await batchWriteAll({ table, items });
        }
    };
};
