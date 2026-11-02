import { beforeEach, describe, expect, it } from "vitest";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types";
import { createModelField } from "@webiny/api-headless-cms";
import { CmsEntryOpenSearchExecFiltering } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchExecFiltering";
import { createEntrySystemFields } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/fields/system.js";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { createModel } from "./mocks/fields";
import { createQuery, Query } from "./mocks";

const reviewField = createModelField({
    id: "review",
    fieldId: "review",
    storageId: "review",
    type: "object",
    label: "Review",
    settings: {
        fields: ["state", "stepId"].map(fieldId => {
            return createModelField({
                id: fieldId,
                fieldId,
                storageId: fieldId,
                type: "text",
                label: fieldId
            });
        })
    }
});

describe("entry system field filter", () => {
    let query: Query;

    const execFiltering = (where: Record<string, unknown>) => {
        const impl = createTestContainer().resolve(CmsEntryOpenSearchExecFiltering);
        impl.execute({
            model: createModel(),
            fields: createEntrySystemFields([reviewField]),
            where: where as CmsEntryListWhere,
            query
        });
    };

    beforeEach(() => {
        query = createQuery();
    });

    it("should filter by an exact value on the keyword path", async () => {
        execFiltering({ system: { review: { state: "approved" } } });

        const expected: OpenSearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [
                {
                    term: {
                        "system.review.state.keyword": "approved"
                    }
                }
            ],
            must_not: []
        };
        expect(query).toEqual(expected);
    });

    it("should filter by a list of values on the keyword path", async () => {
        execFiltering({ system: { review: { state_in: ["inReview", "approved"] } } });

        const expected: OpenSearchBoolQueryConfig = {
            should: [],
            must: [],
            filter: [
                {
                    terms: {
                        "system.review.state.keyword": ["inReview", "approved"]
                    }
                }
            ],
            must_not: []
        };
        expect(query).toEqual(expected);
    });

    it("should combine multiple filters", async () => {
        execFiltering({ system: { review: { state: "approved", stepId: "s1" } } });

        expect(query.filter).toEqual([
            { term: { "system.review.state.keyword": "approved" } },
            { term: { "system.review.stepId.keyword": "s1" } }
        ]);
    });

    it("should create no system fields when none are registered", async () => {
        expect(createEntrySystemFields([])).toEqual({});
    });
});
