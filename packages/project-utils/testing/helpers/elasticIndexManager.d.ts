import { ElasticsearchClient } from "../elasticsearch/createClient";

interface Params {
    global: any;
    client: Promise<ElasticsearchClient>;
    onBeforeEach?: () => Promise<void>;
}
export declare function elasticIndexManager(params: Params): void;
