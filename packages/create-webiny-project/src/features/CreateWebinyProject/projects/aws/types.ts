export type StorageOps = "ddb" | "ddb-os";
export type AiAgent = string | "other";

export interface AwsProjectParams {
    region: string;
    storageOps: StorageOps;
    aiAgent: AiAgent;
}
