import { Client, OpenSearchClientOptions as ElasticsearchClientOptions } from "@webiny/api-opensearch";

interface ElasticsearchClient extends Client {
    indices: Client["indices"] & {
        refreshAll: () => Promise<any>;
        deleteAll: () => Promise<any>;
        registerIndex: (names: string[] | string) => void;
    };
}

export { ElasticsearchClientOptions, ElasticsearchClient };

export declare function createElasticsearchClient(
    options?: Partial<ElasticsearchClientOptions>
): ElasticsearchClient;

export type { ElasticsearchClient as Client };
