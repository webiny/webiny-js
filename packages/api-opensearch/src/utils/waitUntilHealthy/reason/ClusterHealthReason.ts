import type { OpenSearchCatClusterHealthStatus } from "~/operations/index.js";
import type { IReason } from "~/utils/waitUntilHealthy/reason/IReason.js";

export interface IClusterHealthReasonParams {
    minimum: OpenSearchCatClusterHealthStatus;
    current: OpenSearchCatClusterHealthStatus;
    description?: string;
}

export class ClusterHealthReason implements IReason {
    public readonly name = "clusterHealth";
    public readonly minimum: OpenSearchCatClusterHealthStatus;
    public readonly current: OpenSearchCatClusterHealthStatus;
    public readonly description?: string;

    public constructor(params: IClusterHealthReasonParams) {
        this.minimum = params.minimum;
        this.current = params.current;
        this.description = params.description;
    }
}

export const createClusterHealthStatusReason = (
    params: IClusterHealthReasonParams
): ClusterHealthReason => {
    return new ClusterHealthReason(params);
};
