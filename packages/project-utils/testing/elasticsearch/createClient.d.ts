import { Client, OpenSearchClientOptions } from "@webiny/api-opensearch";

interface ElasticsearchClient extends Client {
    indices: Client["indices"] & {
        refreshAll: () => Promise<any>;
        deleteAll: () => Promise<any>;
        registerIndex: (names: string[] | string) => void;
    };
}

export { OpenSearchClientOptions, ElasticsearchClient };

export declare function createElasticsearchClient(
    options?: Partial<OpenSearchClientOptions>
): ElasticsearchClient;

export type { ElasticsearchClient as Client };
