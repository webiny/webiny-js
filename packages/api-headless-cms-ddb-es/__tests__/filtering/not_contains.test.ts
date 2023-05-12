import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { CreateExecFilteringResponse } from "~/operations/entry/elasticsearch/filtering";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createQuery, Query, createPluginsContainer } from "./mocks";
import { normalizeValue } from "@webiny/api-elasticsearch";
import { createExecFiltering } from "./mocks/filtering";

describe("not_contains filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering({
            plugins: createPluginsContainer()
        });
    });

    it("should add not_contains filter", async () => {
        const title = "Webiny";
        const where: CmsEntryListWhere = {
            title_not_contains: title
        };

        execFiltering({
            query,
            where
        });

        const expected: ElasticsearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [],
            must_not: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["values.title"],
                        query: `*${normalizeValue(title)}*`,
                        default_operator: "and"
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });
});
