export type StorageOps = "sqlite" | "pglite" | "postgres";
export type AiAgent = string | "other";

export interface StandaloneProjectParams {
    storageOps: StorageOps;
    aiAgent: AiAgent;
}
