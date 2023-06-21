import { useGraphQlHandler } from "~tests/utils/useGraphQlHandler";
import { createMockAcoApp, MOCK_APP_NAME } from "~tests/mocks/app";

describe("app graphql model", () => {
    const { aco } = useGraphQlHandler({
        plugins: [createMockAcoApp()]
    });

    it("should not fetch app model when no apps are registered", async () => {
        const [response] = await aco.getAppModel({
            id: "UnknownApp"
        });

        expect(response).toEqual({
            data: {
                aco: {
                    getAppModel: {
                        data: null,
                        error: {
                            message: `App "UnknownApp" is not registered.`,
                            code: "APP_NOT_REGISTERED",
                            data: {
                                apps: ["MockApp"],
                                name: "UnknownApp"
                            }
                        }
                    }
                }
            }
        });
    });

    it("should fetch app model when app is registered", async () => {
        const [response] = await aco.getAppModel({
            id: MOCK_APP_NAME
        });
        expect(response).toMatchObject({
            data: {
                aco: {
                    getAppModel: {
                        data: {
                            modelId: "acoSearchRecord-mockapp",
                            name: "ACO - Search Record MockApp",
                            pluralApiName: "AcoSearchRecordMockAppApiName",
                            singularApiName: "AcoSearchRecordMockAppApiName",
                            titleFieldId: "title"
                        },
                        error: null
                    }
                }
            }
        });
        expect(response.data.aco.getAppModel.data.fields).toHaveLength(6);
    });
});
