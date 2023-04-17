import { ElasticsearchIndexRequestBody } from "@webiny/api-elasticsearch/types";

import { base } from "./base";
import { japanese } from "./japanese";

export interface ElasticsearchIndexPlugins {
    body: ElasticsearchIndexRequestBody;
    locales?: string[];
}

export const elasticsearchIndexPlugins = (): ElasticsearchIndexPlugins[] => {
    return [base, japanese];
};
