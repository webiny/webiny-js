import { ElasticsearchCatClusterHealthStatus } from "~/operations";
import { IReason } from "~/utils/waitUntilHealthy/reason/IReason";

export interface IClusterHealthReason {
    minimum: ElasticsearchCatClusterHealthStatus;
    current: ElasticsearchCatClusterHealthStatus;
}
class ClusterHealthReason implements IReason {
    public readonly name = "clusterHealth";
    public readonly minimum: ElasticsearchCatClusterHealthStatus;
    public readonly current: ElasticsearchCatClusterHealthStatus;

    public constructor(params: IClusterHealthReason) {
        this.minimum = params.minimum;
        this.current = params.current;
    }
}

export const createClusterHealthStatusReason = (
    params: IClusterHealthReason
): IClusterHealthReason => {
    return new ClusterHealthReason(params);
};
