import { Client } from "@elastic/elasticsearch";
import { ElasticsearchClientOptions as BaseElasticsearchClientOptions } from "../../../api-elasticsearch/src/client";

interface ElasticsearchClient extends Client {
    indices: Client["indices"] & {
        refreshAll: () => Promise<any>;
        deleteAll: () => Promise<any>;
        registerIndex: (names: string[] | string) => void;
    };
}

interface ElasticsearchClientOptions extends BaseElasticsearchClientOptions {
    indexes: string[];
}

export { ElasticsearchClientOptions, ElasticsearchClient };

export declare function createElasticsearchClient(
    options?: Partial<ElasticsearchClientOptions>
): Promise<ElasticsearchClient>;
