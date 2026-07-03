import { beforeEach, describe, expect, it } from "vitest";
import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types";
import { createQuery, Query } from "./mocks";
import { createExecFiltering, CreateExecFilteringResponse } from "./mocks/filtering";

describe("not startsWith filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering();
    });

    it("should add not_startsWith filter", async () => {
        const title = "webiny";
        const where: CmsEntryListWhere = {
            values: {
                title_not_startsWith: title
            }
        };

        execFiltering({
            query,
            where
        });

        const expected: OpenSearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [],
            must_not: [
                {
                    match_phrase_prefix: {
                        ["values.title"]: title
                    }
                }
            ]
        };

        expect(query).toEqual(expected);
    });
});
