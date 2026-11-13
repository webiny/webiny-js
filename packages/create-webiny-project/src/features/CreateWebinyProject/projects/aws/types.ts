export type StorageOps = "ddb" | "ddb-os" | "pg";
export type AiAgent = string | "other";

export interface AwsProjectParams {
    region: string;
    storageOps: StorageOps;
    aiAgent: AiAgent;
}
