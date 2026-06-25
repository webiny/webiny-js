import { beforeEach, describe, expect, it } from "vitest";
import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types";
import { createQuery, Query } from "./mocks";
import { CreateExecFilteringResponse } from "~/operations/entry/elasticsearch/filtering";
import { createExecFiltering } from "./mocks/filtering";

describe("lesser than filter", () => {
    let query: Query;
    let execFiltering: CreateExecFilteringResponse;

    beforeEach(() => {
        query = createQuery();
        execFiltering = createExecFiltering();
    });

    it("should add lesser than filter", async () => {
        const where: CmsEntryListWhere = {
            values: {
                age_lt: 766
            }
        };

        execFiltering({
            query,
            where
        });

        const expected: OpenSearchBoolQueryConfig = {
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
