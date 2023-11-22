import { CmsModelPlugin } from "~/plugins";

describe("content model via code", () => {
    beforeEach(async () => {
        jest.clearAllMocks();
    });
    afterEach(async () => {
        jest.clearAllMocks();
    });

    it("should properly construct content model via code and call build fields", async () => {
        /**
         * Types are not properly defined for jest.spyOn.
         */
        // @ts-expect-error
        const buildFields = jest.spyOn(CmsModelPlugin.prototype, "buildFields");

        const model = new CmsModelPlugin({
            group: {
                id: "group",
                name: "Group"
            },
            name: "Test",
            modelId: "test",
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    label: "Title",
                    type: "text"
                },
                {
                    id: "obj",
                    fieldId: "obj",
                    label: "Obj",
                    type: "object",
                    settings: {
                        fields: [
                            {
                                id: "objTitle",
                                fieldId: "objTitle",
                                label: "Obj Title",
                                type: "text"
                            }
                        ]
                    }
                }
            ],
            layout: [["title"], ["obj"]],
            singularApiName: "Test",
            pluralApiName: "Tests",
            titleFieldId: "id",
            description: "Test model"
        });

        expect(buildFields).toBeCalledTimes(2);

        expect(model.contentModel).toMatchObject({
            modelId: "test"
        });
    });

    it("should properly construct content model via code and not call build fields", async () => {
        /**
         * Types are not properly defined for jest.spyOn.
         */
        // @ts-expect-error
        const buildFields = jest.spyOn(CmsModelPlugin.prototype, "buildFields");

        const model = new CmsModelPlugin({
            noValidate: true,
            group: {
                id: "group",
                name: "Group"
            },
            name: "Test",
            modelId: "test",
            fields: [
                {
                    id: "title",
                    storageId: "text@title",
                    fieldId: "title",
                    label: "Title",
                    type: "text"
                },
                {
                    id: "obj",
                    storageId: "object@obj",
                    fieldId: "obj",
                    label: "Obj",
                    type: "object",
                    settings: {
                        fields: [
                            {
                                id: "objTitle",
                                fieldId: "objTitle",
                                label: "Obj Title",
                                type: "text",
                                storageId: "text@objTitle"
                            }
                        ]
                    }
                }
            ],
            layout: [],
            singularApiName: "Test",
            pluralApiName: "Tests",
            titleFieldId: "id",
            description: "Test model"
        });

        expect(buildFields).toBeCalledTimes(0);

        expect(model.contentModel).toMatchObject({
            modelId: "test"
        });
    });
});
