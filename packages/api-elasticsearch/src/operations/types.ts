export enum ElasticsearchCatHealthStatus {
    Green = "green",
    Yellow = "yellow",
    Red = "red"
}

export interface IElasticsearchCatHealthResponse {
    epoch: number;
    timestamp: `${number}:${number}:${number}`;
    cluster: string;
    status: ElasticsearchCatHealthStatus;
    "node.total": `${number}`;
    "node.data": `${number}`;
    shards: `${number}`;
    pri: `${number}`;
    relo: `${number}`;
    init: `${number}`;
    unassign: `${number}`;
    pending_tasks: `${number}`;
    max_task_wait_time: string;
    active_shards_percent: `${number}%`;
    discovered_cluster_manager?: `${boolean}`;
}

export interface IElasticsearchCatNodeResponse {
    ip: string;
    "heap.percent": `${number}`;
    "ram.percent": `${number}`;
    cpu: `${number}`;
    load_1m: `${number}` | null;
    load_5m: `${number}` | null;
    load_15m: `${number}` | null;
    "node.role": string;
    master?: string;
    name: string;
}

export type IElasticsearchCatNodesResponse = IElasticsearchCatNodeResponse[];
