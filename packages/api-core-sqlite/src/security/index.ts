import WebinyError from "@webiny/error";
import type { Database } from "@webiny/db-sqlite";
import type {
    SecurityStorageOperations,
    StorageApiKey,
    StorageRole,
    StorageTeam,
    StorageOperationsCreateApiKeyParams,
    StorageOperationsCreateRoleParams,
    StorageOperationsCreateTeamParams,
    StorageOperationsDeleteApiKeyParams,
    StorageOperationsDeleteRoleParams,
    StorageOperationsDeleteTeamParams,
    StorageOperationsGetApiKeyByTokenParams,
    StorageOperationsGetApiKeyBySlugParams,
    StorageOperationsGetApiKeyParams,
    StorageOperationsGetRoleParams,
    StorageOperationsGetTeamParams,
    StorageOperationsListApiKeysParams,
    StorageOperationsListRolesParams,
    StorageOperationsListTeamsParams,
    StorageOperationsUpdateApiKeyParams,
    StorageOperationsUpdateRoleParams,
    StorageOperationsUpdateTeamParams
} from "@webiny/api-core/types/security.js";
import { findByGsi1Sk, listByGsi1 } from "../utils/scan.js";
import { deleteRow, getRow, upsertRow } from "../utils/row.js";

export interface CreateSecurityStorageOperationsParams {
    db: Database;
}

const apiKeyKey = (tenant: string, id: string) => ({
    pk: `T#${tenant}#API_KEY#${id}`,
    sk: "A"
});

const roleKey = (tenant: string, id: string) => ({
    pk: `T#${tenant}#ROLE#${id}`,
    sk: "A"
});

const teamKey = (tenant: string, id: string) => ({
    pk: `T#${tenant}#TEAM#${id}`,
    sk: "A"
});

const sortItems = <T>(items: T[], sort?: string[]): T[] => {
    if (!sort || sort.length === 0) {
        return items;
    }
    return [...items].sort((a, b) => {
        for (const directive of sort) {
            const result = compareByDirective(a, b, directive);
            if (result !== 0) {
                return result;
            }
        }
        return 0;
    });
};

const compareByDirective = <T>(a: T, b: T, directive: string): number => {
    const [field, direction] = directive.split("_");
    const dir = direction === "DESC" ? -1 : 1;
    const av = (a as Record<string, unknown>)[field!];
    const bv = (b as Record<string, unknown>)[field!];
    if (av === bv) {
        return 0;
    }
    if (av === undefined || av === null) {
        return 1;
    }
    if (bv === undefined || bv === null) {
        return -1;
    }
    const aStr = String(av);
    const bStr = String(bv);
    if (aStr === bStr) {
        return 0;
    }
    return aStr < bStr ? -dir : dir;
};

export const createStorageOperations = (
    params: CreateSecurityStorageOperationsParams
): SecurityStorageOperations => {
    const { db } = params;

    return {
        // ---------- API Keys ----------
        async createApiKey({ apiKey }: StorageOperationsCreateApiKeyParams) {
            try {
                await upsertRow(db, apiKeyKey(apiKey.tenant, apiKey.id), apiKey, {
                    gsi1Pk: `T#${apiKey.tenant}#API_KEYS`,
                    gsi1Sk: apiKey.token,
                    gsiTenantPk: apiKey.tenant
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create api key.",
                    code: "CREATE_API_KEY_ERROR"
                });
            }
        },

        async updateApiKey({ apiKey }: StorageOperationsUpdateApiKeyParams) {
            try {
                await upsertRow(db, apiKeyKey(apiKey.tenant, apiKey.id), apiKey, {
                    gsi1Pk: `T#${apiKey.tenant}#API_KEYS`,
                    gsi1Sk: apiKey.token,
                    gsiTenantPk: apiKey.tenant
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update api key.",
                    code: "UPDATE_API_KEY_ERROR"
                });
            }
        },

        async deleteApiKey({ apiKey }: StorageOperationsDeleteApiKeyParams) {
            await deleteRow(db, apiKeyKey(apiKey.tenant, apiKey.id));
        },

        async getApiKey({ tenant, id }: StorageOperationsGetApiKeyParams) {
            try {
                return await getRow<StorageApiKey>(db, apiKeyKey(tenant, id));
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key.",
                    code: "GET_API_KEY_ERROR"
                });
            }
        },

        async getApiKeyByToken({ tenant, token }: StorageOperationsGetApiKeyByTokenParams) {
            try {
                return await findByGsi1Sk<StorageApiKey>(db, `T#${tenant}#API_KEYS`, token);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key by token.",
                    code: "GET_BY_TOKEN_API_KEY_ERROR"
                });
            }
        },

        async getApiKeyBySlug({ tenant, slug }: StorageOperationsGetApiKeyBySlugParams) {
            // DDB uses GSI2 here (gsi1 is for token). Our SQLite schema
            // doesn't have GSI2, so we scan the api-keys partition and
            // filter by slug in memory. Acceptable: api-key-by-slug is on
            // the creation path only, not the per-request auth path.
            try {
                const all = await listByGsi1<StorageApiKey>(db, {
                    gsi1Pk: `T#${tenant}#API_KEYS`
                });
                return all.find(k => k.slug === slug) ?? null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key by slug.",
                    code: "GET_BY_SLUG_API_KEY_ERROR"
                });
            }
        },

        async listApiKeys({ where, sort }: StorageOperationsListApiKeysParams) {
            try {
                const items = await listByGsi1<StorageApiKey>(db, {
                    gsi1Pk: `T#${where.tenant}#API_KEYS`
                });
                return sortItems(items, sort);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list api keys.",
                    code: "LIST_API_KEY_ERROR"
                });
            }
        },

        // ---------- Roles ----------
        async createRole({ role }: StorageOperationsCreateRoleParams) {
            try {
                await upsertRow(db, roleKey(role.tenant, role.id), role, {
                    gsi1Pk: `T#${role.tenant}#ROLES`,
                    gsi1Sk: role.slug,
                    gsiTenantPk: role.tenant
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create role.",
                    code: "CREATE_ROLE_ERROR"
                });
            }
        },

        async updateRole({ role }: StorageOperationsUpdateRoleParams) {
            try {
                await upsertRow(db, roleKey(role.tenant, role.id), role, {
                    gsi1Pk: `T#${role.tenant}#ROLES`,
                    gsi1Sk: role.slug,
                    gsiTenantPk: role.tenant
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update role.",
                    code: "UPDATE_ROLE_ERROR"
                });
            }
        },

        async deleteRole({ role }: StorageOperationsDeleteRoleParams) {
            await deleteRow(db, roleKey(role.tenant, role.id));
        },

        async getRole({ where }: StorageOperationsGetRoleParams) {
            const { tenant, id, slug } = where;
            try {
                if (id) {
                    return await getRow<StorageRole>(db, roleKey(tenant, id));
                }
                if (slug) {
                    return await findByGsi1Sk<StorageRole>(db, `T#${tenant}#ROLES`, slug);
                }
                return null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load role.",
                    code: "GET_ROLE_ERROR"
                });
            }
        },

        async listRoles({ where, sort }: StorageOperationsListRolesParams) {
            try {
                let items = await listByGsi1<StorageRole>(db, {
                    gsi1Pk: `T#${where.tenant}#ROLES`
                });
                items = sortItems(items, sort);
                if (Array.isArray(where.id_in)) {
                    const idIn = where.id_in;
                    return items.filter(item => idIn.includes(item.id));
                }
                if (Array.isArray(where.slug_in)) {
                    const slugIn = where.slug_in;
                    return items.filter(item => slugIn.includes(item.slug));
                }
                return items;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list roles.",
                    code: "LIST_ROLE_ERROR"
                });
            }
        },

        // ---------- Teams ----------
        async createTeam({ team }: StorageOperationsCreateTeamParams) {
            try {
                await upsertRow(db, teamKey(team.tenant, team.id), team, {
                    gsi1Pk: `T#${team.tenant}#TEAMS`,
                    gsi1Sk: team.slug,
                    gsiTenantPk: team.tenant
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create team.",
                    code: "CREATE_TEAM_ERROR"
                });
            }
        },

        async updateTeam({ team }: StorageOperationsUpdateTeamParams) {
            try {
                await upsertRow(db, teamKey(team.tenant, team.id), team, {
                    gsi1Pk: `T#${team.tenant}#TEAMS`,
                    gsi1Sk: team.slug,
                    gsiTenantPk: team.tenant
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update team.",
                    code: "UPDATE_TEAM_ERROR"
                });
            }
        },

        async deleteTeam({ team }: StorageOperationsDeleteTeamParams) {
            await deleteRow(db, teamKey(team.tenant, team.id));
        },

        async getTeam({ where }: StorageOperationsGetTeamParams) {
            const { tenant, id, slug } = where;
            try {
                if (id) {
                    return await getRow<StorageTeam>(db, teamKey(tenant, id));
                }
                if (slug) {
                    return await findByGsi1Sk<StorageTeam>(db, `T#${tenant}#TEAMS`, slug);
                }
                return null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load team.",
                    code: "GET_TEAM_ERROR"
                });
            }
        },

        async listTeams({ where, sort }: StorageOperationsListTeamsParams) {
            try {
                let items = await listByGsi1<StorageTeam>(db, {
                    gsi1Pk: `T#${where.tenant}#TEAMS`
                });
                items = sortItems(items, sort);
                if (Array.isArray(where.id_in)) {
                    const idIn = where.id_in;
                    return items.filter(item => idIn.includes(item.id));
                }
                if (Array.isArray(where.slug_in)) {
                    const slugIn = where.slug_in;
                    return items.filter(item => slugIn.includes(item.slug));
                }
                return items;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list teams.",
                    code: "LIST_TEAM_ERROR"
                });
            }
        }
    };
};
