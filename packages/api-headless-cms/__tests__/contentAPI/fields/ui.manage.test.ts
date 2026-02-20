import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler.js";
import { createModelGroupPlugin } from "~/plugins/index.js";

describe("UI field - manage api", () => {
    const { createContentModelMutation } = useGraphQLHandler({
        path: "manage",
        plugins: [
            createModelGroupPlugin({
                id: "ungrouped",
                name: "Ungrouped",
                slug: "ungrouped",
                icon: {
                    name: "Ungrouped",
                    type: "text"
                },
                description: ""
            })
        ]
    });

    it("should properly create a model with ui field", async () => {
        const [response] = await createContentModelMutation({
            data: {
                name: "Test Model",
                group: "ungrouped",
                singularApiName: "TestModel",
                pluralApiName: "TestModels",
                fields: [
                    {
                        id: "title",
                        fieldId: "title",
                        validation: [],
                        listValidation: [],
                        label: "Title",
                        type: "text"
                    },
                    {
                        id: "baseUi",
                        fieldId: "baseUi",
                        validation: [],
                        listValidation: [],
                        label: "Base UI Field",
                        type: "ui",
                        settings: {
                            render: "ui"
                        }
                    },
                    {
                        id: "separator",
                        fieldId: "separator",
                        validation: [],
                        listValidation: [],
                        label: "UI Field",
                        type: "ui:separator",
                        settings: {
                            render: "uiSeparator"
                        }
                    }
                ]
            }
        });

        expect(response).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        name: "Test Model",
                        fields: [
                            {
                                id: "title",
                                fieldId: "title",
                                storageId: "text@title",
                                validation: [],
                                listValidation: [],
                                label: "Title",
                                type: "text"
                            },
                            {
                                id: "baseUi",
                                fieldId: "baseUi",
                                storageId: "ui@baseUi",
                                validation: [],
                                listValidation: [],
                                label: "Base UI Field",
                                type: "ui",
                                settings: {
                                    render: "ui"
                                }
                            },
                            {
                                id: "separator",
                                fieldId: "separator",
                                storageId: "ui@separator",
                                validation: [],
                                listValidation: [],
                                label: "UI Field",
                                type: "ui:separator",
                                settings: {
                                    render: "uiSeparator"
                                }
                            }
                        ]
                    },
                    error: null
                }
            }
        });
    });
});
