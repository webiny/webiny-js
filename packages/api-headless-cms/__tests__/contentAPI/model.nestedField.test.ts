import { CmsGroup, CmsModelField } from "~/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";

const noNestedFieldsObject: CmsModelField = {
    id: "nonestedfieldsobject",
    multipleValues: false,
    helpText: "",
    label: "No fields object",
    fieldId: "noFieldsObject",
    type: "object",
    settings: {
        fields: []
    },
    validation: [],
    listValidation: [],
    placeholderText: "",
    predefinedValues: {
        enabled: false,
        values: []
    },
    renderer: {
        name: "renderer"
    }
};

describe("Model - nested field", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        getContentModelQuery,
        listContentModelsQuery,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

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

    it("should not fail list models if any model has empty nested field", async () => {
        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Model",
                group: contentModelGroup.id
            }
        });

        expect(createResponse).toEqual({
            data: {
                createContentModel: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const [updateResponse] = await updateContentModelMutation({
            modelId: "testModel",
            data: {
                fields: [noNestedFieldsObject],
                layout: [[noNestedFieldsObject.id]]
            }
        });

        expect(updateResponse).toEqual({
            data: {
                updateContentModel: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const [getResponse] = await getContentModelQuery({
            modelId: "testModel"
        });

        expect(getResponse).toEqual({
            data: {
                getContentModel: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        const [listResponse] = await listContentModelsQuery({
            modelId: "testModel"
        });

        expect(listResponse).toEqual({
            data: {
                listContentModels: {
                    data: expect.any(Array),
                    error: null
                }
            }
        });
    });
});
