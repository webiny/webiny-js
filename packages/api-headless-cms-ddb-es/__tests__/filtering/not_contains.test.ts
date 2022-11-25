import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPlugins, Plugins, Fields, createFields } from "./mocks";
import { normalizeValue } from "@webiny/api-elasticsearch";

describe("not_contains filter", () => {
    let fields: Fields;
    let query: Query;
    let plugins: Plugins;

    beforeEach(() => {
        fields = createFields();
        query = createQuery();
        plugins = createPlugins();
    });

    it("should add not_contains filter", async () => {
        const title = "Webiny";
        const where: CmsEntryListWhere = {
            title_not_contains: title
        };

        applyFiltering({
            plugins: plugins.container,
            fields,
            query,
            where,
            operatorPlugins: plugins.operators,
            searchPlugins: plugins.search
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [],
            must_not: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["values.titleStorageId"],
                        query: normalizeValue(title),
                        default_operator: "and"
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });
});
