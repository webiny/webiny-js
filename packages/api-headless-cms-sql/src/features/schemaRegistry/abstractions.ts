import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ISchemaRegistry {
    /* Check if a table has been verified this process. */
    isVerified(tableName: string): boolean;
    /* Mark a table as verified. */
    markVerified(tableName: string): void;
    /* Remove a table from the verified set. */
    removeVerified(tableName: string): void;
}

export const SchemaRegistryAbstraction =
    createAbstraction<ISchemaRegistry>("Cms/Sql/SchemaRegistry");

export namespace SchemaRegistryAbstraction {
    export type Interface = ISchemaRegistry;
}
