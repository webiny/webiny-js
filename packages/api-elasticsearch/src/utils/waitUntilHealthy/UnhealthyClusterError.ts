import { WebinyError } from "@webiny/error";

export class UnhealthyClusterError extends WebinyError {
    public constructor(maxWaitingTime: number) {
        super({
            message: `Cluster did not become healthy in ${maxWaitingTime} seconds.`,
            code: "UNHEALTHY_CLUSTER"
        });
    }
}
