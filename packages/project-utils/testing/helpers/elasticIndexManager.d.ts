import { ElasticsearchClient } from "../elasticsearch/client";

interface Params {
    global: any;
    client: ElasticsearchClient;
    onBeforeEach?: () => Promise<void>;
}
export declare function elasticIndexManager(params: Params): void;
