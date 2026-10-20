import { AbstractStorageOps } from "./AbstractStorageOps.js";

export class SqlStorageOps extends AbstractStorageOps {
    id = "sql" as const;
    shortId = "sql";
    displayName = "SQL";
}
