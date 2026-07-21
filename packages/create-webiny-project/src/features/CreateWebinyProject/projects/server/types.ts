export type StorageOps = "sqlite";
export type AiAgent = string | "other";

export interface ServerProjectParams {
    storageOps: StorageOps;
    aiAgent: AiAgent;
}
