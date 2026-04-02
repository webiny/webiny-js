import type { HealthRecord } from "@opensearch-project/opensearch/api/_types/cat.health";
import type { NodesRecord } from "@opensearch-project/opensearch/api/_types/cat.nodes";

export enum OpenSearchCatClusterHealthStatus {
    Green = "green",
    Yellow = "yellow",
    Red = "red"
}

export type IOpenSearchCatHealthResponse = HealthRecord;

export type IOpenSearchCatNodeResponse = NodesRecord;

export type IOpenSearchCatNodesResponse = IOpenSearchCatNodeResponse[];
