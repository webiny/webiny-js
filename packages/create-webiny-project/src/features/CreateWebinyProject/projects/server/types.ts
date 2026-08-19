export type StorageOps = "sqlite" | "postgres";
export type AiAgent = string | "other";

export interface ServerProjectParams {
    storageOps: StorageOps;
    aiAgent: AiAgent;
}
