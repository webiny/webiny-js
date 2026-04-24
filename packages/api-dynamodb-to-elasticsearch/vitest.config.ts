import { createTestConfig } from "../../testing";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

export default async () => {
    const prefix = getOpenSearchIndexPrefix();
    process.env.OPENSEARCH_INDEX_PREFIX = `${prefix}api-elasticsearch-`;
    return createTestConfig({ path: import.meta.dirname });
};
