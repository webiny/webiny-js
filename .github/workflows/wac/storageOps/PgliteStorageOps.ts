import { AbstractStorageOps } from "./AbstractStorageOps.js";

export class PgliteStorageOps extends AbstractStorageOps {
    id = "sql" as const;
    shortId = "pglite";
    displayName = "PGlite";
}
