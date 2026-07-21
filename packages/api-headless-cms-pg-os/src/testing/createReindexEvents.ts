import type { Knex } from "knex";
import type { SyncEvent, ISyncRow } from "~/types.js";

export const createReindexEvents = async (knex: Knex, tableName: string): Promise<SyncEvent[]> => {
    const rows: ISyncRow[] = await knex<ISyncRow>(tableName).select("*");

    return rows.map(row => ({
        type: "INSERT" as const,
        id: row.id,
        entryId: row.entryId,
        tenant: row.tenant,
        index: row.index,
        data: row.data
    }));
};
