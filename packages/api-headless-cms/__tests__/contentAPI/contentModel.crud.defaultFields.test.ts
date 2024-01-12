import { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

const name = "Model with default fields";
const modelId = "modelWithDefaultFields";
const singularApiName = "ModelWithDefaultFields";
const pluralApiName = "ModelWithDefaultFieldsPlural";

describe("content model default fields", () => {
    const { createContentModelGroupMutation, createContentModelMutation, getContentModelQuery } =
        useGraphQLHandler({
            path: "manage/en-US"
        });

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

    it("should not create a content model with default fields - with undefined", async () => {
        const [response] = await createContentModelMutation({
            data: {
                name,
                modelId,
                singularApiName,
                pluralApiName,
                group: contentModelGroup.id
            }
        });

        expect(response).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        name,
                        modelId,
                        fields: []
                    },
                    error: null
                }
            }
        });
        expect(response.data.createContentModel.data.fields).toHaveLength(0);
        expect(response.data.createContentModel.data.layout).toHaveLength(0);
    });

    it("should not create a content model with default fields - with false", async () => {
        const [response] = await createContentModelMutation({
            data: {
                name,
                modelId,
                singularApiName,
                pluralApiName,
                group: contentModelGroup.id,
                defaultFields: false
            }
        });

        expect(response).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        name,
                        modelId,
                        fields: []
                    },
                    error: null
                }
            }
        });
        expect(response.data.createContentModel.data.fields).toHaveLength(0);
        expect(response.data.createContentModel.data.layout).toHaveLength(0);
    });

    it("should create a content model with default fields", async () => {
        const [createResponse] = await createContentModelMutation({
            data: {
                name,
                modelId,
                singularApiName,
                pluralApiName,
                group: contentModelGroup.id,
                defaultFields: true
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        name,
                        modelId,
                        fields: [
                            {
                                fieldId: "title",
                                type: "text",
                                label: "Title"
                            },
                            {
                                fieldId: "description",
                                type: "long-text",
                                label: "Description"
                            },
                            {
                                fieldId: "image",
                                type: "file",
                                label: "Image",
                                settings: {
                                    imagesOnly: true
                                }
                            }
                        ]
                    },
                    error: null
                }
            }
        });

        const [response] = await getContentModelQuery({
            modelId
        });

        expect(response).toMatchObject({
            data: {
                getContentModel: {
                    data: {
                        name,
                        modelId,
                        fields: [
                            {
                                fieldId: "title",
                                type: "text",
                                label: "Title"
                            },
                            {
                                fieldId: "description",
                                type: "long-text",
                                label: "Description"
                            },
                            {
                                fieldId: "image",
                                type: "file",
                                label: "Image",
                                settings: {
                                    imagesOnly: true
                                }
                            }
                        ]
                    },
                    error: null
                }
            }
        });
        expect(response.data.getContentModel.data.fields).toHaveLength(3);
        expect(response.data.getContentModel.data.layout).toHaveLength(2);
    });
});
