import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { applyFiltering } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPlugins, Plugins, Fields, createFields } from "./mocks";

describe("lesser than or equal filter", () => {
    let fields: Fields;
    let query: Query;
    let plugins: Plugins;

    beforeEach(() => {
        fields = createFields();
        query = createQuery();
        plugins = createPlugins();
    });

    it("should add lesser than or equal filter", async () => {
        const where: CmsEntryListWhere = {
            age_lte: 626
        };

        applyFiltering({
            fields,
            query,
            where,
            operatorPlugins: plugins.operators,
            searchPlugins: plugins.search
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [],
            should: [],
            filter: [
                {
                    range: {
                        "values.ageStorageId": {
                            lte: 626
                        }
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });
});
