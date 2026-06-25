import { SecurityStorageOperations as SecurityStorageOperationsAbstraction } from "@webiny/api-core/features/security/shared/abstractions.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { WebinyError } from "@webiny/error";
import { createApiKeyEntity } from "./definitions/entities.js";
import { createRoleEntity } from "./definitions/entities.js";
import { createTeamEntity } from "./definitions/entities.js";
import type { IEntityQueryOneParams } from "@webiny/db-dynamodb";
import { sortItems } from "@webiny/db-dynamodb";
import type { StorageApiKey } from "@webiny/api-core/types/security.js";
import type { StorageRole } from "@webiny/api-core/types/security.js";
import type { StorageTeam } from "@webiny/api-core/types/security.js";
import type { IApiKeyEntity } from "./definitions/types.js";
import type { IRoleEntity } from "./definitions/types.js";
import type { ITeamEntity } from "./definitions/types.js";

class SecurityStorageOperationsImpl implements SecurityStorageOperationsAbstraction.Interface {
    private readonly entities: {
        apiKeys: IApiKeyEntity;
        roles: IRoleEntity;
        teams: ITeamEntity;
    };

    public constructor(
        tableFactory: DynamoDbTableFactory.Interface,
        entityFactory: DynamoDbEntityFactory.Interface
    ) {
        const client = tableFactory.create({
            name: process.env.DB_TABLE as string
        });

        this.entities = {
            apiKeys: createApiKeyEntity({ client, entityFactory }),
            roles: createRoleEntity({ client, entityFactory }),
            teams: createTeamEntity({ client, entityFactory })
        };
    }

    public async createApiKey({ apiKey }: { apiKey: StorageApiKey }): Promise<void> {
        const keys = {
            ...this.createApiKeyKeys(apiKey),
            ...this.createApiKeyGsiKeys(apiKey),
            TYPE: "security.apiKey"
        };

        try {
            await this.entities.apiKeys.put({
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
    }

    public async updateApiKey({ apiKey }: { apiKey: StorageApiKey }): Promise<void> {
        const keys = {
            ...this.createApiKeyKeys(apiKey),
            ...this.createApiKeyGsiKeys(apiKey),
            TYPE: "security.apiKey"
        };

        try {
            await this.entities.apiKeys.put({
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
    }

    public async deleteApiKey({ apiKey }: { apiKey: StorageApiKey }): Promise<void> {
        const keys = this.createApiKeyKeys(apiKey);

        try {
            await this.entities.apiKeys.delete(keys);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update api key.",
                code: "UPDATE_API_KEY_ERROR",
                data: { keys }
            });
        }
    }

    public async getApiKey({
        id,
        tenant
    }: {
        id: string;
        tenant: string;
    }): Promise<StorageApiKey | null> {
        const keys = this.createApiKeyKeys({ id, tenant });

        try {
            const response = await this.entities.apiKeys.get(keys);

            return response?.data || null;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load api key.",
                code: "GET_API_KEY_ERROR",
                data: { id, keys }
            });
        }
    }

    public async getApiKeyByToken({
        tenant,
        token
    }: {
        tenant: string;
        token: string;
    }): Promise<StorageApiKey | null> {
        const queryParams: IEntityQueryOneParams = {
            partitionKey: `T#${tenant}#API_KEYS`,
            options: {
                eq: token,
                index: "GSI1"
            }
        };

        try {
            const result = await this.entities.apiKeys.queryOne(queryParams);
            return result?.data || null;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load api key by token.",
                code: "GET_BY_TOKEN_API_KEY_ERROR",
                data: { partitionKey: queryParams.partitionKey, options: queryParams.options }
            });
        }
    }

    public async getApiKeyBySlug({
        tenant,
        slug
    }: {
        tenant: string;
        slug: string;
    }): Promise<StorageApiKey | null> {
        const queryParams: IEntityQueryOneParams = {
            partitionKey: `T#${tenant}#API_KEYS`,
            options: {
                eq: slug,
                index: "GSI2"
            }
        };

        try {
            const result = await this.entities.apiKeys.queryOne(queryParams);
            return result?.data || null;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load api key by slug.",
                code: "GET_BY_SLUG_API_KEY_ERROR",
                data: { partitionKey: queryParams.partitionKey, options: queryParams.options }
            });
        }
    }

    public async listApiKeys({
        where: { tenant },
        sort
    }: {
        where: { tenant: string };
        sort?: string[];
    }): Promise<StorageApiKey[]> {
        let items;
        try {
            items = await this.entities.apiKeys.queryAll({
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
    }

    public async createRole({ role }: { role: StorageRole }): Promise<void> {
        const keys = {
            ...this.createRoleKeys(role),
            ...this.createRoleGsiKeys(role),
            TYPE: "security.role"
        };

        try {
            await this.entities.roles.put({
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
    }

    public async updateRole({ role }: { role: StorageRole }): Promise<void> {
        const keys = {
            ...this.createRoleKeys(role),
            ...this.createRoleGsiKeys(role),
            TYPE: "security.role"
        };

        try {
            await this.entities.roles.put({
                data: role,
                ...keys
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update role.",
                code: "UPDATE_ROLE_ERROR",
                data: { keys, role }
            });
        }
    }

    public async deleteRole({ role }: { role: StorageRole }): Promise<void> {
        const keys = this.createRoleKeys(role);

        try {
            await this.entities.roles.delete(keys);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete role.",
                code: "CREATE_DELETE_ERROR",
                data: { keys, role }
            });
        }
    }

    public async getRole({
        where: { tenant, id, slug }
    }: {
        where: { tenant: string; id?: string; slug?: string };
    }): Promise<StorageRole | null> {
        try {
            if (id) {
                const result = await this.entities.roles.get(this.createRoleKeys({ tenant, id }));
                return result?.data || null;
            }
            const result = await this.entities.roles.queryOne({
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
    }

    public async listRoles({
        where: { tenant, id_in, slug_in },
        sort
    }: {
        where: { tenant: string; id_in?: string[]; slug_in?: string[] };
        sort?: string[];
    }): Promise<StorageRole[]> {
        let items: StorageRole[];
        try {
            const ddbItems = await this.entities.roles.queryAll({
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
    }

    public async createTeam({ team }: { team: StorageTeam }): Promise<void> {
        const keys = {
            ...this.createTeamKeys(team),
            ...this.createTeamGsiKeys(team),
            TYPE: "security.team"
        };

        try {
            await this.entities.teams.put({
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
    }

    public async updateTeam({ team }: { team: StorageTeam }): Promise<void> {
        const keys = {
            ...this.createTeamKeys(team),
            ...this.createTeamGsiKeys(team),
            TYPE: "security.team"
        };

        try {
            await this.entities.teams.put({
                data: team,
                ...keys
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update team.",
                code: "UPDATE_TEAM_ERROR",
                data: { keys, team }
            });
        }
    }

    public async deleteTeam({ team }: { team: StorageTeam }): Promise<void> {
        const keys = this.createTeamKeys(team);

        try {
            await this.entities.teams.delete(keys);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete team.",
                code: "CREATE_DELETE_ERROR",
                data: { keys, team }
            });
        }
    }

    public async getTeam({
        where: { tenant, id, slug }
    }: {
        where: { tenant: string; id?: string; slug?: string };
    }): Promise<StorageTeam | null> {
        try {
            if (id) {
                const result = await this.entities.teams.get(this.createTeamKeys({ tenant, id }));

                return result?.data || null;
            }

            const result = await this.entities.teams.queryOne({
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
    }

    public async listTeams({
        where: { tenant, id_in, slug_in },
        sort
    }: {
        where: { tenant: string; id_in?: string[]; slug_in?: string[] };
        sort?: string[];
    }): Promise<StorageTeam[]> {
        let items: StorageTeam[];
        try {
            const ddbRecords = await this.entities.teams.queryAll({
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
    }

    /* API key primary keys. */
    private createApiKeyKeys({ id, tenant }: Pick<StorageApiKey, "id" | "tenant">) {
        return {
            PK: `T#${tenant}#API_KEY#${id}`,
            SK: `A`
        };
    }

    /* API key GSI keys. */
    private createApiKeyGsiKeys({
        slug,
        token,
        tenant
    }: Pick<StorageApiKey, "slug" | "tenant" | "token">) {
        return {
            GSI1_PK: `T#${tenant}#API_KEYS`,
            GSI1_SK: token,
            GSI2_PK: `T#${tenant}#API_KEYS`,
            GSI2_SK: slug,
            GSI_TENANT: tenant
        };
    }

    /* Role primary keys. */
    private createRoleKeys(role: Pick<StorageRole, "tenant" | "id">) {
        return {
            PK: `T#${role.tenant}#ROLE#${role.id}`,
            SK: `A`
        };
    }

    /* Role GSI keys. */
    private createRoleGsiKeys(role: Pick<StorageRole, "tenant" | "slug">) {
        return {
            GSI1_PK: `T#${role.tenant}#ROLES`,
            GSI1_SK: role.slug,
            GSI_TENANT: role.tenant as string
        };
    }

    /* Team primary keys. */
    private createTeamKeys(team: Pick<StorageTeam, "tenant" | "id">) {
        return {
            PK: `T#${team.tenant}#TEAM#${team.id}`,
            SK: `A`
        };
    }

    /* Team GSI keys. */
    private createTeamGsiKeys(team: Pick<StorageTeam, "tenant" | "slug">) {
        return {
            GSI1_PK: `T#${team.tenant}#TEAMS`,
            GSI1_SK: team.slug,
            GSI_TENANT: team.tenant as string
        };
    }
}

export const SecurityStorageOperations = SecurityStorageOperationsAbstraction.createImplementation({
    implementation: SecurityStorageOperationsImpl,
    dependencies: [DynamoDbTableFactory, DynamoDbEntityFactory]
});
