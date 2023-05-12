import { Sort } from "@webiny/api-elasticsearch/types";
import { CmsEntryElasticsearchSortModifierPlugin } from "~/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";

const model = {} as unknown as CmsModel;

describe("Elasticsearch sort modifier plugin", () => {
    it("should transform existing sort - add new sort", async () => {
        const plugin = new CmsEntryElasticsearchSortModifierPlugin({
            modifySort: ({ sort }) => {
                if (typeof sort !== "object") {
                    return;
                }
                // @ts-ignore
                sort["newField"] = {
                    order: "asc"
                };
            }
        });

        const sort: Sort = {
            ["field.keyword"]: {
                order: "asc"
            }
        };

        plugin.modifySort({
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
        const plugin = new CmsEntryElasticsearchSortModifierPlugin({
            modifySort: ({ sort }) => {
                if (typeof sort !== "object") {
                    return;
                }

                for (const key in sort) {
                    // @ts-ignore
                    delete sort[key];
                }
                // @ts-ignore
                sort["_script"] = {
                    type: "number",
                    script: {
                        lang: "painless",
                        source: "source"
                    },
                    order: "asc"
                };
            }
        });

        const sort: Sort = {
            ["field.keyword"]: {
                order: "asc"
            }
        };

        plugin.modifySort({
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
