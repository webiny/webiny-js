import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { CreateExecFilteringResponse } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { createExecFiltering } from "./mocks/filtering";

describe("lesser than or equal filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add lesser than or equal filter", async () => {
        const where: CmsEntryListWhere = {
            age_lte: 626
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [],
            should: [],
            filter: [
                {
                    range: {
                        "values.age": {
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
