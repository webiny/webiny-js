import type { ElasticsearchIndexRequestBody } from "@webiny/api-elasticsearch/types.js";

import { base } from "./base.js";

export interface ElasticsearchIndexPlugins {
    body: ElasticsearchIndexRequestBody;
    locales?: string[];
}

export const elasticsearchIndexPlugins = (): ElasticsearchIndexPlugins[] => {
    return [base];
};
