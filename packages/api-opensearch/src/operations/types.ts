import type {
    Cat_Health_ResponseBody,
    Cat_Nodes_ResponseBody
} from "@opensearch-project/opensearch/api/index.js";

export enum OpenSearchCatClusterHealthStatus {
    Green = "green",
    Yellow = "yellow",
    Red = "red"
}

type HealthRecord = Cat_Health_ResponseBody[number];

type NodesRecord = Cat_Nodes_ResponseBody[number];

export type IOpenSearchCatHealthResponse = HealthRecord;

export type IOpenSearchCatNodeResponse = NodesRecord;

export type IOpenSearchCatNodesResponse = IOpenSearchCatNodeResponse[];
