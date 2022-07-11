import { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { emptyObjectFields } from "./mocks/emptyObjectFields";

describe("Model - nested field", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        listContentModelsQuery,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

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

    it("should prevent update of the model if it doesn't produce a valid GraphQL SDL", async () => {
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
                fields: emptyObjectFields.fields,
                layout: emptyObjectFields.layout
            }
        });

        expect(updateResponse).toEqual({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "INVALID_MODEL_DEFINITION",
                        data: {
                            modelId: "testModel",
                            sdl: expect.any(String),
                            invalidField: "repeat"
                        },
                        message: expect.any(String)
                    }
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
