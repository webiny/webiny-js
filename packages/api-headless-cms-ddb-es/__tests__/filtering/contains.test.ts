import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPlugins, Plugins, Fields, createFields } from "./mocks";
import { normalizeValue } from "@webiny/api-elasticsearch";

describe("contains filter", () => {
    let fields: Fields;
    let query: Query;
    let plugins: Plugins;

    beforeEach(() => {
        fields = createFields();
        query = createQuery();
        plugins = createPlugins();
    });

    it("should add contains filter", async () => {
        const title = "Webiny";
        const where: CmsEntryListWhere = {
            title_contains: title
        };

        applyFiltering({
            fields,
            query,
            where,
            operatorPlugins: plugins.operators,
            searchPlugins: plugins.search
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["values.titleStorageId"],
                        query: normalizeValue(title),
                        default_operator: "and"
                    }
                }
            ],
            filter: [],
            must_not: []
        };

        expect(query).toEqual(expected);
    });
});
