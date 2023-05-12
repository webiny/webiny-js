import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { normalizeValue } from "@webiny/api-elasticsearch";
import { createExecFiltering, CreateExecFilteringResponse } from "./mocks/filtering";

describe("contains filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add contains filter", async () => {
        const title = "Webiny";
        const where: CmsEntryListWhere = {
            title_contains: title
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["values.title"],
                        query: `*${normalizeValue(title)}*`,
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
