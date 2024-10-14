import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsGroup } from "~/types";
import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";

describe("ContentModel modelId variations", () => {
    const manageHandlerOpts = { path: "manage/en-US" };

    const { createContentModelGroupMutation, createContentModelMutation } =
        useGraphQLHandler(manageHandlerOpts);

    let contentModelGroup: CmsGroup;

    beforeEach(async () => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;
    });

    const disallowedModelIdEndings: [string, string | undefined][] = [
        ["Tab list", "tabList"],
        ["Tab list", undefined],
        ["Tab response", "tabResponse"],
        ["Tab response", undefined],
        ["Tab meta", "tabMeta"],
        ["Tab meta", undefined],
        ["Tab input", "tabInput"],
        ["Tab input", undefined],
        ["Tab sorter", "tabSorter"],
        ["Tab sorter", undefined]
    ];

    test.each(disallowedModelIdEndings)(
        "should not allow to create model with modelId that clashes with GraphQL (%s, %s) - singularApiName",
        async (name, modelId) => {
            const singularApiName = upperFirst(camelCase(modelId || name));
            const pluralApiName = pluralize(upperFirst(camelCase(`${name}Pluralized`)));
            const [response] = await createContentModelMutation({
                data: {
                    name,
                    modelId,
                    singularApiName,
                    pluralApiName,
                    group: contentModelGroup.id
                }
            });

            expect(response).toEqual({
                data: {
                    createContentModel: {
                        data: null,
                        error: {
                            code: "MODEL_SINGULAR_API_NAME_ENDING_NOT_ALLOWED",
                            data: {
                                input: singularApiName,
                                disallowedEnding: [
                                    "Response",
                                    "List",
                                    "Meta",
                                    "Input",
                                    "Sorter",
                                    "RefType"
                                ]
                            },
                            message: expect.stringMatching(
                                `Content model with singularApiName "${singularApiName}" is not allowed, as it ends in disallowed value.`
                            )
                        }
                    }
                }
            });
        }
    );

    test.each(disallowedModelIdEndings)(
        "should not allow to create model with modelId that clashes with GraphQL (%s, %s) - pluralApiName",
        async (name, modelId) => {
            const singularApiName = `${upperFirst(camelCase(modelId || name))}OkEnding`;
            const pluralApiName = upperFirst(camelCase(modelId || name));
            const [response] = await createContentModelMutation({
                data: {
                    name,
                    modelId,
                    singularApiName,
                    pluralApiName,
                    group: contentModelGroup.id
                }
            });

            expect(response).toEqual({
                data: {
                    createContentModel: {
                        data: null,
                        error: {
                            code: "MODEL_PLURAL_API_NAME_NOT_ENDING_ALLOWED",
                            data: {
                                input: pluralApiName,
                                disallowedEnding: [
                                    "Response",
                                    "List",
                                    "Meta",
                                    "Input",
                                    "Sorter",
                                    "RefType"
                                ]
                            },
                            message: expect.stringMatching(
                                `Content model with pluralApiName "${pluralApiName}" is not allowed, as it ends in disallowed value.`
                            )
                        }
                    }
                }
            });
        }
    );
});
