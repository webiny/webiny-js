import { describe, expect, it } from "vitest";
import type { Sort } from "@webiny/api-opensearch/types";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import type { CmsEntryOpenSearchSortModifier } from "~/features/CmsEntryOpenSearchSortModifier/index.js";

const model = {} as unknown as CmsModel;

describe("OpenSearch sort modifier", () => {
    it("should transform existing sort - add new sort", async () => {
        const modifier: CmsEntryOpenSearchSortModifier.Interface = {
            modifySort: ({ sort }) => {
                if (typeof sort !== "object") {
                    return;
                }
                // @ts-expect-error
                sort["newField"] = {
                    order: "asc"
                };
            }
        };

        const sort: Sort = {
            ["field.keyword"]: {
                order: "asc"
            }
        };

        modifier.modifySort({
            sort,
            model
        });

        expect(sort).toEqual({
            ["field.keyword"]: {
                order: "asc"
            },
            ["newField"]: {
                order: "asc"
            }
        });
    });

    it("should transform existing sort - replace existing sort", async () => {
        const modifier: CmsEntryOpenSearchSortModifier.Interface = {
            modifySort: ({ sort }) => {
                if (typeof sort !== "object") {
                    return;
                }

                for (const key in sort) {
                    // @ts-expect-error
                    delete sort[key];
                }
                // @ts-expect-error
                sort["_script"] = {
                    type: "number",
                    script: {
                        lang: "painless",
                        source: "source"
                    },
                    order: "asc"
                };
            }
        };

        const sort: Sort = {
            ["field.keyword"]: {
                order: "asc"
            }
        };

        modifier.modifySort({
            sort,
            model
        });

        expect(sort).toEqual({
            _script: {
                type: "number",
                script: {
                    lang: "painless",
                    source: "source"
                },
                order: "asc"
            }
        });
    });
});
