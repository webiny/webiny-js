import type { Knex } from "knex";
import type { SyncEvent, ISyncRow, SyncEventType } from "~/types.js";

export interface SimulatePgStreamParams {
    knex: Knex;
    tableName: string;
    handler: (events: SyncEvent[]) => Promise<void>;
}

const toSyncEvent = (row: ISyncRow, type: SyncEventType): SyncEvent => ({
    type,
    id: row.id,
    entryId: row.entryId,
    tenant: row.tenant,
    index: row.index,
    ...(type !== "REMOVE" ? { data: row.data } : {})
});

/**
 * Simulates a PostgreSQL -> OpenSearch sync stream (the PG equivalent of the
 * DynamoDB Streams simulation in `@webiny/project-utils/testing/dynamodb`) by
 * monkey-patching knex's internal `client.query` method.
 *
 * Uses a snapshot-diff approach: capture all rows in the target table before
 * the operation, execute the operation, capture all rows after, then diff the
 * two snapshots to determine which `SyncEvent`s occurred. This is robust
 * against SQL structure changes, since it never has to parse bindings or SQL
 * text to reconstruct row data.
 */
export const simulatePgStream = (params: SimulatePgStreamParams): void => {
    const { knex, tableName, handler } = params;
    const query = () => knex<ISyncRow>(tableName);

    const originalClient = knex.client;
    const originalQuery = originalClient.query.bind(originalClient);

    originalClient.query = async (connection: unknown, obj: unknown) => {
        const sql: string = typeof obj === "string" ? obj : ((obj as { sql?: string })?.sql ?? "");
        const isTargetTable = sql.includes(tableName);

        if (!isTargetTable) {
            return originalQuery(connection, obj);
        }

        const upperSql = sql.toUpperCase();
        const isInsert = upperSql.includes("INSERT");
        const isDelete = upperSql.includes("DELETE");

        if (!isInsert && !isDelete) {
            return originalQuery(connection, obj);
        }

        const rowsBefore = await query().select("*");
        const beforeMap = new Map(rowsBefore.map(row => [row.id, row]));

        const result = await originalQuery(connection, obj);

        const rowsAfter = await query().select("*");
        const afterMap = new Map(rowsAfter.map(row => [row.id, row]));

        const events: SyncEvent[] = [];

        if (isInsert) {
            for (const [id, row] of afterMap) {
                const before = beforeMap.get(id);
                if (!before) {
                    events.push(toSyncEvent(row, "INSERT"));
                } else if (before.data !== row.data) {
                    events.push(toSyncEvent(row, "MODIFY"));
                }
            }
        }

        if (isDelete) {
            for (const [id, row] of beforeMap) {
                if (!afterMap.has(id)) {
                    events.push(toSyncEvent(row, "REMOVE"));
                }
            }
        }

        if (events.length > 0) {
            await handler(events);
        }

        return result;
    };
};
