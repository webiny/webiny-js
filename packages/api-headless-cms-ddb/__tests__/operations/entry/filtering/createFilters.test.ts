import { createFilters } from "~/operations/entry/filtering/createFilters";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createModel } from "../../helpers/createModel";
import { createFields } from "~/operations/entry/filtering/createFields";
import { Field } from "~/operations/entry/filtering/types";
import { createPluginsContainer } from "../../helpers/pluginsContainer";

describe("create filters from where conditions", () => {
    let plugins: PluginsContainer;
    let model: CmsModel;
    let fields: Record<string, Field>;

    beforeEach(() => {
        plugins = createPluginsContainer();
        model = createModel();
        fields = createFields({
            plugins,
            model
        });
    });

    it("should create simple filters", async () => {
        const result = createFilters({
            plugins,
            fields,
            where: {
                id_gte: 500,
                title_not_contains: "webiny",
                priority_in: [2],
                createdBy: "123#admin",
                parent: {
                    id_in: ["parentIdNumber"]
                },
                authors: {
                    entryId_in: ["authorId1", "authorId2"]
                }
            }
        });

        expect(result).toEqual([
            {
                compareValue: 500,
                fieldId: "id",
                filterPlugin: {
                    _params: {
                        matches: expect.any(Function),
                        operation: "gte"
                    },
                    name: expect.stringMatching(/dynamodb\.value\.filter\-/)
                },
                negate: false,
                path: "id",
                transformValue: expect.any(Function)
            },
            {
                compareValue: "webiny",
                fieldId: "title",
                filterPlugin: {
                    _params: {
                        matches: expect.any(Function),
                        operation: "contains"
                    },
                    name: expect.stringMatching(/dynamodb\.value\.filter\-/)
                },
                negate: true,
                path: "values.title",
                transformValue: expect.any(Function)
            },
            {
                compareValue: [2],
                fieldId: "priority",
                filterPlugin: {
                    _params: {
                        matches: expect.any(Function),
                        operation: "in"
                    },
                    name: expect.stringMatching(/dynamodb\.value\.filter\-/)
                },
                negate: false,
                path: "values.priority",
                transformValue: expect.any(Function)
            },
            {
                compareValue: "123#admin",
                fieldId: "createdBy",
                filterPlugin: {
                    _params: {
                        matches: expect.any(Function),
                        operation: "eq"
                    },
                    name: expect.stringMatching(/dynamodb\.value\.filter\-/)
                },
                negate: false,
                path: "createdBy.id",
                transformValue: expect.any(Function)
            },
            {
                compareValue: ["parentIdNumber"],
                fieldId: "parent",
                filterPlugin: {
                    _params: {
                        matches: expect.any(Function),
                        operation: "in"
                    },
                    name: expect.stringMatching(/dynamodb\.value\.filter\-/)
                },
                negate: false,
                path: "values.parent.id",
                transformValue: expect.any(Function)
            },
            {
                compareValue: ["authorId1", "authorId2"],
                fieldId: "authors",
                filterPlugin: {
                    _params: {
                        matches: expect.any(Function),
                        operation: "in"
                    },
                    name: expect.stringMatching(/dynamodb\.value\.filter\-/)
                },
                negate: false,
                path: "values.authors.*.entryId",
                transformValue: expect.any(Function)
            }
        ]);
    });
});
