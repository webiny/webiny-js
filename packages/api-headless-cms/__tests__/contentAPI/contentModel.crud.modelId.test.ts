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
                icon: "ico/ico",
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
        "should not allow to create model with modelId that clashes with GraphQL (%s, %s)",
        async (name, modelId) => {
            const [response] = await createContentModelMutation({
                data: {
                    name,
                    modelId,
                    singularApiName: upperFirst(camelCase(name)),
                    pluralApiName: pluralize(upperFirst(camelCase(name))),
                    group: contentModelGroup.id
                }
            });

            expect(response).toEqual({
                data: {
                    createContentModel: {
                        data: null,
                        error: {
                            code: "MODEL_ID_NOT_ALLOWED",
                            data: {
                                modelId: modelId || camelCase(name)
                            },
                            message: expect.stringMatching(
                                /ModelId that ends with "([a-zA-Z]+)" is not allowed./
                            )
                        }
                    }
                }
            });
        }
    );
});
