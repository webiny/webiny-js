export const createSyncBridge = (knex, syncTableName, handler) => {
    return async () => {
        const hasTable = await knex.schema.hasTable(syncTableName);
        if (!hasTable) {
            return;
        }

        const rows = await knex(syncTableName).select("*");
        if (rows.length === 0) {
            return;
        }

        const records = rows.map(row => ({
            id: row.id,
            entryId: row.entryId,
            index: row.index,
            operation: row.operation,
            data: JSON.parse(row.data),
            tenant: row.tenant
        }));

        await handler(records);
        await knex(syncTableName).delete();
    };
};
