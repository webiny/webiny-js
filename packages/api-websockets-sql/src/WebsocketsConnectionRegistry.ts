import type { Knex } from "knex";
import { WebinyError } from "@webiny/error";
import type {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData,
    IWebsocketsConnectionRegistryRegisterParams,
    IWebsocketsConnectionRegistryUnregisterParams
} from "@webiny/api-websockets";

interface ConnectionRow {
    connectionId: string;
    identityId: string;
    identityDisplayName: string;
    identityType: string;
    tenant: string;
    endpoint: string;
    connectedOn: string;
}

const BASE_TABLE_NAME = "WebsocketsConnections";

export interface WebsocketsConnectionRegistryConfig {
    knex: Knex;
    tableNamePrefix?: string;
}

export class WebsocketsConnectionRegistry implements IWebsocketsConnectionRegistry {
    private readonly knex: Knex;
    private readonly tableName: string;

    public constructor({ knex, tableNamePrefix }: WebsocketsConnectionRegistryConfig) {
        this.knex = knex;
        this.tableName = tableNamePrefix
            ? `${tableNamePrefix}_${BASE_TABLE_NAME}`
            : BASE_TABLE_NAME;
    }

    public async register(
        event: IWebsocketsConnectionRegistryRegisterParams
    ): Promise<IWebsocketsConnectionRegistryData> {
        try {
            await this.ensureTable();
            await this.migrateTable();

            const row: ConnectionRow = {
                connectionId: event.connectionId,
                identityId: event.identity.id,
                identityDisplayName: event.identity.displayName,
                identityType: event.identity.type,
                tenant: event.tenant,
                endpoint: event.endpoint,
                connectedOn: event.connectedOn
            };

            await this.knex<ConnectionRow>(this.tableName).insert(row);

            return this.toData(row);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not register websockets connection.",
                code: "REGISTER_CONNECTION_ERROR",
                data: { event }
            });
        }
    }

    public async unregister(event: IWebsocketsConnectionRegistryUnregisterParams): Promise<void> {
        try {
            await this.ensureTable();
            await this.migrateTable();

            const existing = await this.knex<ConnectionRow>(this.tableName)
                .where("connectionId", event.connectionId)
                .first();

            if (!existing) {
                throw new WebinyError(
                    `Connection "${event.connectionId}" does not exist.`,
                    "CONNECTION_NOT_FOUND",
                    { connectionId: event.connectionId }
                );
            }

            await this.knex<ConnectionRow>(this.tableName)
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

    public async listViaConnections(
        connections: string[]
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();

            const rows = await this.knex<ConnectionRow>(this.tableName).whereIn(
                "connectionId",
                connections
            );

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list websockets connections by connection IDs.",
                code: "LIST_VIA_CONNECTIONS_ERROR",
                data: { connections }
            });
        }
    }

    public async listViaIdentity(identity: string): Promise<IWebsocketsConnectionRegistryData[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();

            const rows = await this.knex<ConnectionRow>(this.tableName).where(
                "identityId",
                identity
            );

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list websockets connections by identity.",
                code: "LIST_VIA_IDENTITY_ERROR",
                data: { identity }
            });
        }
    }

    public async listViaTenant(tenant: string): Promise<IWebsocketsConnectionRegistryData[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();

            const rows = await this.knex<ConnectionRow>(this.tableName).where("tenant", tenant);

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list websockets connections by tenant.",
                code: "LIST_VIA_TENANT_ERROR",
                data: { tenant }
            });
        }
    }

    public async listAll(): Promise<IWebsocketsConnectionRegistryData[]> {
        try {
            await this.ensureTable();
            await this.migrateTable();

            const rows = await this.knex<ConnectionRow>(this.tableName).select("*");

            return rows.map(row => this.toData(row));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list all websockets connections.",
                code: "LIST_ALL_CONNECTIONS_ERROR"
            });
        }
    }

    private async ensureTable(): Promise<void> {
        const exists = await this.knex.schema.hasTable(this.tableName);
        if (exists) {
            return;
        }

        await this.knex.schema.createTable(this.tableName, table => {
            table.text("connectionId").notNullable().primary();
            table.text("identityId").notNullable();
            table.text("identityDisplayName").notNullable();
            table.text("identityType").notNullable();
            table.text("tenant").notNullable();
            table.text("endpoint").notNullable();
            table.datetime("connectedOn").notNullable();
            table.index(["identityId"]);
            table.index(["tenant"]);
        });
    }

    private async migrateTable(): Promise<void> {
        const hasEndpoint = await this.knex.schema.hasColumn(this.tableName, "endpoint");
        if (hasEndpoint) {
            return;
        }

        await this.knex.schema.alterTable(this.tableName, (table) => {
            table.text("endpoint").nullable();
        });

        await this.knex(this.tableName).update({
            endpoint: this.knex.raw("'https://' || \"domainName\" || '/' || \"stage\"")
        });

        await this.knex.schema.alterTable(this.tableName, (table) => {
            table.text("endpoint").notNullable().alter();
            table.dropColumn("domainName");
            table.dropColumn("stage");
        });
    }

    private toData(row: ConnectionRow): IWebsocketsConnectionRegistryData {
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
