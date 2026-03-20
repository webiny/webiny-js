import { WebinyError } from "@webiny/error";

export class WaitingHealthyClusterAbortedError extends WebinyError {
    public constructor(message?: string) {
        super({
            message: message || `Waiting for the cluster to become healthy was aborted.`,
            code: "WAITING_HEALTHY_CLUSTER_ABORTED"
        });
    }
}
