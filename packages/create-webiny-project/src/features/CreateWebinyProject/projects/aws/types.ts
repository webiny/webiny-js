export type StorageOps = "ddb" | "ddb-os";

export interface AwsProjectParams {
    region: string;
    storageOps: StorageOps;
}
