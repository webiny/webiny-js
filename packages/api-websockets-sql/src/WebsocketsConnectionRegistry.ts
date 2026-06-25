import { WebinyError } from "@webiny/error";
import { KnexClient } from "@webiny/api-core-sql";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { TableName } from "~/TableName/abstractions.js";

interface ConnectionRow {
    connectionId: string;
    identityId: string;
    identityDisplayName: string;
    identityType: string;
    tenant: string;
    endpoint: string;
    connectedOn: string;
    lastSeen: string | null;
}

const BASE_TABLE_NAME = "WebsocketsConnections";

class WebsocketsConnectionRegistryImpl implements ConnectionRegistry.Interface {
    private readonly knex;
    private readonly tableName;

    public constructor(knex: KnexClient.Interface, tableName: TableName.Interface) {
        this.knex = knex;
        this.tableName = tableName.resolve(BASE_TABLE_NAME);
    }

    public async register(
        event: ConnectionRegistry.RegisterParams
    ): Promise<ConnectionRegistry.Data> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            const row: ConnectionRow = {
                connectionId: event.connectionId,
                identityId: event.identity.id,
                identityDisplayName: event.identity.displayName,
                identityType: event.identity.type,
                tenant: event.tenant,
                endpoint: event.endpoint,
                connectedOn: event.connectedOn,
                lastSeen: new Date().toISOString()
            };

            await this.knex.client<ConnectionRow>(this.tableName).insert(row);

            return this.toData(row);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not register websockets connection.",
                code: "REGISTER_CONNECTION_ERROR",
                data: { event }
            });
        }
    }

    public async unregister(event: ConnectionRegistry.UnregisterParams): Promise<void> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            const existing = await this.knex
                .client<ConnectionRow>(this.tableName)
                .where("connectionId", event.connectionId)
                .first();

            if (!existing) {
                throw new WebinyError(
                    `Connection "${event.connectionId}" does not exist.`,
                    "CONNECTION_NOT_FOUND",
                    { connectionId: event.connectionId }
                );
            }

            await this.knex
                .client<ConnectionRow>(this.tableName)
                .where("connectionId", event.connectionId)
                .delete();
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not unregister websockets connection.",
                code: "UNREGISTER_CONNECTION_ERROR",
                data: { event }
            });
        }
    }

    public async listViaConnections(connections: string[]): Promise<ConnectionRegistry.Data[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            const rows = await this.knex
                .client<ConnectionRow>(this.tableName)
                .whereIn("connectionId", connections);

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list websockets connections by connection IDs.",
                code: "LIST_VIA_CONNECTIONS_ERROR",
                data: { connections }
            });
        }
    }

    public async listViaIdentity(identity: string): Promise<ConnectionRegistry.Data[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            const rows = await this.knex
                .client<ConnectionRow>(this.tableName)
                .where("identityId", identity);

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list websockets connections by identity.",
                code: "LIST_VIA_IDENTITY_ERROR",
                data: { identity }
            });
        }
    }

    public async listViaTenant(tenant: string): Promise<ConnectionRegistry.Data[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            const rows = await this.knex
                .client<ConnectionRow>(this.tableName)
                .where("tenant", tenant);

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list websockets connections by tenant.",
                code: "LIST_VIA_TENANT_ERROR",
                data: { tenant }
            });
        }
    }

    public async listAll(): Promise<ConnectionRegistry.Data[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            const rows = await this.knex.client<ConnectionRow>(this.tableName).select("*");

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list all websockets connections.",
                code: "LIST_ALL_CONNECTIONS_ERROR"
            });
        }
    }

    public async updateLastSeen(connectionId: string): Promise<void> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            await this.knex
                .client<ConnectionRow>(this.tableName)
                .where("connectionId", connectionId)
                .update({ lastSeen: new Date().toISOString() });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update lastSeen for websockets connection.",
                code: "UPDATE_LAST_SEEN_ERROR",
                data: { connectionId }
            });
        }
    }

    public async listStale(olderThan: Date): Promise<ConnectionRegistry.Data[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();
            await this.migrateLastSeen();

            const threshold = olderThan.toISOString();

            const rows = await this.knex.client<ConnectionRow>(this.tableName).where(qb => {
                qb.where("lastSeen", "<", threshold).orWhereNull("lastSeen");
            });

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list stale websockets connections.",
                code: "LIST_STALE_CONNECTIONS_ERROR",
                data: { olderThan }
            });
        }
    }

    private async ensureTable(): Promise<void> {
        const exists = await this.knex.client.schema.hasTable(this.tableName);
        if (exists) {
            return;
        }

        await this.knex.client.schema.createTable(this.tableName, table => {
            table.text("connectionId").notNullable().primary();
            table.text("identityId").notNullable();
            table.text("identityDisplayName").notNullable();
            table.text("identityType").notNullable();
            table.text("tenant").notNullable();
            table.text("endpoint").notNullable();
            table.datetime("connectedOn").notNullable();
            table.datetime("lastSeen").nullable();
            table.index(["identityId"]);
            table.index(["tenant"]);
        });
    }

    private async migrateTable(): Promise<void> {
        const hasEndpoint = await this.knex.client.schema.hasColumn(this.tableName, "endpoint");
        if (hasEndpoint) {
            return;
        }

        await this.knex.client.schema.alterTable(this.tableName, table => {
            table.text("endpoint").nullable();
        });

        await this.knex.client(this.tableName).update({
            endpoint: this.knex.client.raw("'https://' || \"domainName\" || '/' || \"stage\"")
        });

        await this.knex.client.schema.alterTable(this.tableName, table => {
            table.text("endpoint").notNullable().alter();
            table.dropColumn("domainName");
            table.dropColumn("stage");
        });
    }

    private async migrateLastSeen(): Promise<void> {
        const hasLastSeen = await this.knex.client.schema.hasColumn(this.tableName, "lastSeen");
        if (hasLastSeen) {
            return;
        }

        await this.knex.client.schema.alterTable(this.tableName, table => {
            table.datetime("lastSeen").nullable();
        });
    }

    private toData(row: ConnectionRow): ConnectionRegistry.Data {
        return {
            connectionId: row.connectionId,
            identity: {
                id: row.identityId,
                displayName: row.identityDisplayName,
                type: row.identityType
            },
            tenant: row.tenant,
            endpoint: row.endpoint,
            connectedOn: row.connectedOn
        };
    }
}

export const WebsocketsConnectionRegistry = ConnectionRegistry.createImplementation({
    implementation: WebsocketsConnectionRegistryImpl,
    dependencies: [KnexClient, TableName]
});
