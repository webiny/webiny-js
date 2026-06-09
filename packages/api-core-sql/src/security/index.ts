import type { Knex } from "knex";
import type {
    SecurityStorageOperations,
    StorageApiKey,
    StorageRole,
    StorageTeam
} from "@webiny/api-core/types/security.js";
import WebinyError from "@webiny/error";
import type { TableManager } from "~/TableManager.js";
import { sortItems } from "~/sortItems.js";

const ROLES_TABLE = "webiny_core_roles";
const TEAMS_TABLE = "webiny_core_teams";
const API_KEYS_TABLE = "webiny_core_api_keys";

interface IRoleRow {
    id: string;
    tenant: string;
    slug: string;
    data: string;
}

interface ITeamRow {
    id: string;
    tenant: string;
    slug: string;
    data: string;
}

interface IApiKeyRow {
    id: string;
    tenant: string;
    token: string;
    slug: string;
    data: string;
}

interface CreateStorageOperationsParams {
    knex: Knex;
    tableManager: TableManager;
}

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): SecurityStorageOperations => {
    const { knex, tableManager } = params;

    const ensureRolesTable = () => {
        return tableManager.ensure(ROLES_TABLE, table => {
            table.text("id").notNullable();
            table.text("tenant").notNullable();
            table.text("slug").notNullable();
            table.text("data").notNullable();

            table.primary(["tenant", "id"]);
            table.unique(["tenant", "slug"]);
        });
    };

    const ensureTeamsTable = () => {
        return tableManager.ensure(TEAMS_TABLE, table => {
            table.text("id").notNullable();
            table.text("tenant").notNullable();
            table.text("slug").notNullable();
            table.text("data").notNullable();

            table.primary(["tenant", "id"]);
            table.unique(["tenant", "slug"]);
        });
    };

    const ensureApiKeysTable = () => {
        return tableManager.ensure(API_KEYS_TABLE, table => {
            table.text("id").notNullable();
            table.text("tenant").notNullable();
            table.text("token").notNullable();
            table.text("slug").notNullable();
            table.text("data").notNullable();

            table.primary(["tenant", "id"]);
            table.unique(["tenant", "token"]);
            table.unique(["tenant", "slug"]);
        });
    };

    const rolesQuery = () => knex<IRoleRow>(ROLES_TABLE);
    const teamsQuery = () => knex<ITeamRow>(TEAMS_TABLE);
    const apiKeysQuery = () => knex<IApiKeyRow>(API_KEYS_TABLE);

    return {
        /* Roles */
        async getRole({ where: { tenant, id, slug } }) {
            await ensureRolesTable();

            try {
                if (id) {
                    const row = await rolesQuery()
                        .where("tenant", tenant)
                        .andWhere("id", id)
                        .first();

                    return row ? (JSON.parse(row.data) as StorageRole) : null;
                }

                const row = await rolesQuery()
                    .where("tenant", tenant)
                    .andWhere("slug", slug as string)
                    .first();

                return row ? (JSON.parse(row.data) as StorageRole) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load role.",
                    code: "GET_ROLE_ERROR",
                    data: { id, slug }
                });
            }
        },

        async listRoles({ where: { tenant, id_in, slug_in }, sort }) {
            await ensureRolesTable();

            try {
                const qb = rolesQuery().where("tenant", tenant);

                if (Array.isArray(id_in)) {
                    qb.whereIn("id", id_in);
                } else if (Array.isArray(slug_in)) {
                    qb.whereIn("slug", slug_in);
                }

                const rows = await qb;
                const items = rows.map(row => JSON.parse(row.data) as StorageRole);

                return sortItems(items, sort);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list roles.",
                    code: "LIST_ROLE_ERROR"
                });
            }
        },

        async createRole({ role }) {
            await ensureRolesTable();

            try {
                await rolesQuery().insert({
                    id: role.id,
                    tenant: role.tenant,
                    slug: role.slug,
                    data: JSON.stringify(role)
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create role.",
                    code: "CREATE_ROLE_ERROR",
                    data: { role }
                });
            }
        },

        async updateRole({ role }) {
            await ensureRolesTable();

            try {
                await rolesQuery()
                    .where("tenant", role.tenant)
                    .andWhere("id", role.id)
                    .update({
                        slug: role.slug,
                        data: JSON.stringify(role)
                    });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update role.",
                    code: "UPDATE_ROLE_ERROR",
                    data: { role }
                });
            }
        },

        async deleteRole({ role }) {
            await ensureRolesTable();

            try {
                await rolesQuery().where("tenant", role.tenant).andWhere("id", role.id).delete();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete role.",
                    code: "DELETE_ROLE_ERROR",
                    data: { role }
                });
            }
        },

        /* Teams */
        async getTeam({ where: { tenant, id, slug } }) {
            await ensureTeamsTable();

            try {
                if (id) {
                    const row = await teamsQuery()
                        .where("tenant", tenant)
                        .andWhere("id", id)
                        .first();

                    return row ? (JSON.parse(row.data) as StorageTeam) : null;
                }

                const row = await teamsQuery()
                    .where("tenant", tenant)
                    .andWhere("slug", slug as string)
                    .first();

                return row ? (JSON.parse(row.data) as StorageTeam) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load team.",
                    code: "GET_TEAM_ERROR",
                    data: { id, slug }
                });
            }
        },

        async listTeams({ where: { tenant, id_in, slug_in }, sort }) {
            await ensureTeamsTable();

            try {
                const qb = teamsQuery().where("tenant", tenant);

                if (Array.isArray(id_in)) {
                    qb.whereIn("id", id_in);
                } else if (Array.isArray(slug_in)) {
                    qb.whereIn("slug", slug_in);
                }

                const rows = await qb;
                const items = rows.map(row => JSON.parse(row.data) as StorageTeam);

                return sortItems(items, sort);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list teams.",
                    code: "LIST_TEAM_ERROR"
                });
            }
        },

        async createTeam({ team }) {
            await ensureTeamsTable();

            try {
                await teamsQuery().insert({
                    id: team.id,
                    tenant: team.tenant,
                    slug: team.slug,
                    data: JSON.stringify(team)
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create team.",
                    code: "CREATE_TEAM_ERROR",
                    data: { team }
                });
            }
        },

        async updateTeam({ team }) {
            await ensureTeamsTable();

            try {
                await teamsQuery()
                    .where("tenant", team.tenant)
                    .andWhere("id", team.id)
                    .update({
                        slug: team.slug,
                        data: JSON.stringify(team)
                    });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update team.",
                    code: "UPDATE_TEAM_ERROR",
                    data: { team }
                });
            }
        },

        async deleteTeam({ team }) {
            await ensureTeamsTable();

            try {
                await teamsQuery().where("tenant", team.tenant).andWhere("id", team.id).delete();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete team.",
                    code: "DELETE_TEAM_ERROR",
                    data: { team }
                });
            }
        },

        /* API Keys */
        async getApiKey({ id, tenant }) {
            await ensureApiKeysTable();

            try {
                const row = await apiKeysQuery().where("tenant", tenant).andWhere("id", id).first();

                return row ? (JSON.parse(row.data) as StorageApiKey) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key.",
                    code: "GET_API_KEY_ERROR",
                    data: { id }
                });
            }
        },

        async getApiKeyByToken({ tenant, token }) {
            await ensureApiKeysTable();

            try {
                const row = await apiKeysQuery()
                    .where("tenant", tenant)
                    .andWhere("token", token)
                    .first();

                return row ? (JSON.parse(row.data) as StorageApiKey) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key by token.",
                    code: "GET_BY_TOKEN_API_KEY_ERROR",
                    data: { token }
                });
            }
        },

        async getApiKeyBySlug({ tenant, slug }) {
            await ensureApiKeysTable();

            try {
                const row = await apiKeysQuery()
                    .where("tenant", tenant)
                    .andWhere("slug", slug)
                    .first();

                return row ? (JSON.parse(row.data) as StorageApiKey) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load api key by slug.",
                    code: "GET_BY_SLUG_API_KEY_ERROR",
                    data: { slug }
                });
            }
        },

        async listApiKeys({ where: { tenant }, sort }) {
            await ensureApiKeysTable();

            try {
                const rows = await apiKeysQuery().where("tenant", tenant);
                const items = rows.map(row => JSON.parse(row.data) as StorageApiKey);

                return sortItems(items, sort);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list api keys.",
                    code: "LIST_API_KEY_ERROR"
                });
            }
        },

        async createApiKey({ apiKey }) {
            await ensureApiKeysTable();

            try {
                await apiKeysQuery().insert({
                    id: apiKey.id,
                    tenant: apiKey.tenant,
                    token: apiKey.token,
                    slug: apiKey.slug,
                    data: JSON.stringify(apiKey)
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create api key.",
                    code: "CREATE_API_KEY_ERROR",
                    data: { apiKey }
                });
            }
        },

        async updateApiKey({ apiKey }) {
            await ensureApiKeysTable();

            try {
                await apiKeysQuery()
                    .where("tenant", apiKey.tenant)
                    .andWhere("id", apiKey.id)
                    .update({
                        token: apiKey.token,
                        slug: apiKey.slug,
                        data: JSON.stringify(apiKey)
                    });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update api key.",
                    code: "UPDATE_API_KEY_ERROR",
                    data: { apiKey }
                });
            }
        },

        async deleteApiKey({ apiKey }) {
            await ensureApiKeysTable();

            try {
                await apiKeysQuery()
                    .where("tenant", apiKey.tenant)
                    .andWhere("id", apiKey.id)
                    .delete();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete api key.",
                    code: "DELETE_API_KEY_ERROR",
                    data: { apiKey }
                });
            }
        }
    };
};
