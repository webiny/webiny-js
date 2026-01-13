import { createTestConfig } from "../../testing";
import { getElasticsearchIndexPrefix } from "@webiny/api-elasticsearch";

export default async () => {
    const prefix = getElasticsearchIndexPrefix();
    process.env.OPENSEARCH_INDEX_PREFIX = `${prefix}api-elasticsearch-`;
    return createTestConfig({ path: import.meta.dirname });
};
