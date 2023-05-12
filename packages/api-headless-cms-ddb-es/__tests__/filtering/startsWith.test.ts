import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { createExecFiltering, CreateExecFilteringResponse } from "./mocks/filtering";

describe("startsWith filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add startsWith filter", async () => {
        const title = "webiny";
        const where: CmsEntryListWhere = {
            title_startsWith: title
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [
                {
                    match_phrase_prefix: {
                        ["values.title"]: title
                    }
                }
            ],
            must_not: []
        };

        expect(query).toEqual(expected);
    });
});
