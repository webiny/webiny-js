export type StorageOps = "sqlite" | "local-postgres" | "postgres";
export type AiAgent = string | "other";

export interface StandaloneProjectParams {
    storageOps: StorageOps;
    aiAgent: AiAgent;
}
