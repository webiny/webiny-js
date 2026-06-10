import { AbstractStorageOps } from "./AbstractStorageOps.js";

export class SqlStorageOps extends AbstractStorageOps {
    id = "sql,ddb" as const;
    shortId = "sql";
    displayName = "SQL";
}
