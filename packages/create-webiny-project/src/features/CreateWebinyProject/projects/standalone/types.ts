export type StorageOps = "sqlite" | "postgres";
export type AiAgent = string | "other";

export interface StandaloneProjectParams {
    storageOps: StorageOps;
    aiAgent: AiAgent;
}
