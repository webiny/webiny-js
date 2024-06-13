import { ElasticsearchCatClusterHealthStatus } from "~/operations";
import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IClusterHealthReasonParams {
    minimum: ElasticsearchCatClusterHealthStatus;
    current: ElasticsearchCatClusterHealthStatus;
    description?: string;
}

export class ClusterHealthReason implements IReason {
    public readonly name = "clusterHealth";
    public readonly minimum: ElasticsearchCatClusterHealthStatus;
    public readonly current: ElasticsearchCatClusterHealthStatus;
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
