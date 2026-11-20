import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IGroupSchemaManager {
    /* Creates the table on first use; a no-op when the schema is managed at deploy time. */
    ensure(tableName: string): Promise<void>;
    /* Creates the table if missing, whatever the mode (deploy-time schema setup). */
    setup(tableName: string): Promise<void>;
    reset(): void;
}

export const GroupSchemaManager = createAbstraction<IGroupSchemaManager>(
    "Cms/Sql/GroupSchemaManager"
);

export namespace GroupSchemaManager {
    export type Interface = IGroupSchemaManager;
}
