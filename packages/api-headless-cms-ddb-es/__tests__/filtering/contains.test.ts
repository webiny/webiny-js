import { beforeEach, describe, expect, it } from "vitest";
import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types";
import { createQuery, Query } from "./mocks";
import { normalizeValue } from "@webiny/api-opensearch";
import { createExecFiltering, CreateExecFilteringResponse } from "./mocks/filtering";

describe("contains filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering();
    });

    it("should add contains filter", async () => {
        const title = "Webiny";
        const where: CmsEntryListWhere = {
            values: {
                title_contains: title
            }
        };

        execFiltering({
            query,
            where
        });

        const expected: OpenSearchBoolQueryConfig = {
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
