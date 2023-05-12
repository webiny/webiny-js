import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { CreateExecFilteringResponse } from "~/operations/entry/elasticsearch/filtering";
import { createExecFiltering } from "./mocks/filtering";

describe("lesser than filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add lesser than filter", async () => {
        const where: CmsEntryListWhere = {
            age_lt: 766
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
                            lt: 766
                        }
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });
});
