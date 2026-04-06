import { beforeEach, describe, expect, it } from "vitest";
import type { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

describe("content model test no field plugin", () => {
    const manageHandlerOpts = { path: "manage" };

    const {
        createContentModelGroupMutation,
        createContentModelMutation,
        updateContentModelMutation
    } = useGraphQLHandler(manageHandlerOpts);

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

    it("prevent content model update if a backend plugin for a field does not exist", async () => {
        await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "testContentModel",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
                group: contentModelGroup.slug
            }
        }).then(async ([response]) => {
            expect(response).toMatchObject({
                data: {
                    createContentModel: {
                        data: {
                            modelId: "testContentModel",
                            name: "Test Content model",
                            titleFieldId: "id"
                        },
                        error: null
                    }
                }
            });

            await updateContentModelMutation({
                modelId: "testContentModel",
                data: {
                    layout: [["aaa", "bbb"]],
                    fields: [
                        {
                            type: "SOMETHING-INVALID-HERE",
                            validation: [],
                            renderer: {
                                name: "text-input"
                            },
                            label: "test",
                            storageId: "test",
                            fieldId: "test",
                            id: "aaa",
                            predefinedValues: {
                                enabled: false,
                                values: []
                            }
                        },
                        {
                            type: "text",
                            validation: [],
                            renderer: {
                                name: "text-input"
                            },
                            label: "test",
                            storageId: "test",
                            fieldId: "test",
                            id: "bbb",
                            predefinedValues: {
                                enabled: false,
                                values: []
                            }
                        }
                    ]
                }
            }).then(([response]) => {
                expect(response).toEqual({
                    data: {
                        updateContentModel: {
                            data: null,
                            error: {
                                code: "Cms/Model/ValidationError",
                                data: null,
                                message:
                                    'Cannot update content model because of the unknown "SOMETHING-INVALID-HERE" field.'
                            }
                        }
                    }
                });
            });
        });
    });
});
