import { Client } from "@elastic/elasticsearch";
import { ElasticsearchClientOptions } from "../../../api-elasticsearch/src/client";

interface ElasticsearchClient extends Client {
    indices: Client["indices"] & {
        deleteAll: () => Promise<any>;
        registerIndex: (names: string[] | string) => void;
    };
}

export { ElasticsearchClientOptions, ElasticsearchClient };

export declare function createElasticsearchClient(
    options?: Partial<ElasticsearchClientOptions>
): ElasticsearchClient;
