import { beforeEach, describe, expect, it } from "vitest";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types";
import { CmsEntryOpenSearchExecFiltering } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchExecFiltering";
import { systemFields } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/fields/system.js";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { createModel } from "./mocks/fields";
import { createQuery, Query } from "./mocks";

describe("system.workflow filter", () => {
    let query: Query;

    const execFiltering = (where: CmsEntryListWhere) => {
        const impl = createTestContainer().resolve(CmsEntryOpenSearchExecFiltering);
        impl.execute({ model: createModel(), fields: systemFields, where, query });
    };

    beforeEach(() => {
        query = createQuery();
    });

    it("should filter by an exact workflow value on the keyword path", async () => {
        execFiltering({ system: { workflow: { reviewState: "approved" } } });

        const expected: OpenSearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [
                {
                    term: {
                        "system.workflow.reviewState.keyword": "approved"
                    }
                }
            ],
            must_not: []
        };
        expect(query).toEqual(expected);
    });

    it("should filter by a list of workflow values on the keyword path", async () => {
        execFiltering({ system: { workflow: { stepState_in: ["inReview", "approved"] } } });

        const expected: OpenSearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [
                {
                    terms: {
                        "system.workflow.stepState.keyword": ["inReview", "approved"]
                    }
                }
            ],
            must_not: []
        };
        expect(query).toEqual(expected);
    });

    it("should combine multiple workflow filters", async () => {
        execFiltering({ system: { workflow: { workflowId: "wf1", stepId: "s1" } } });

        expect(query.filter).toEqual([
            { term: { "system.workflow.workflowId.keyword": "wf1" } },
            { term: { "system.workflow.stepId.keyword": "s1" } }
        ]);
    });
});
