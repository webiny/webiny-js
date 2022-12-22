import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { normalizeValue } from "@webiny/api-elasticsearch";
import { CmsModelField } from "@webiny/api-headless-cms/types";

interface Params {
    query: ElasticsearchBoolQueryConfig;
    term?: string;
    fields: CmsModelField[];
}
export const applyFullTextSearch = (params: Params): void => {
    const { query, term, fields } = params;
    if (!term || term.length === 0 || fields.length === 0) {
        return;
    }

    const fieldPaths = fields.map(field => {
        return `values.${field.storageId}`;
    });

    query.must.push({
        query_string: {
            allow_leading_wildcard: true,
            fields: fieldPaths,
            query: normalizeValue(term),
            default_operator: "or"
        }
    });
};
