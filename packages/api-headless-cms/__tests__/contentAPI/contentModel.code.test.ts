import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CmsModelPlugin } from "~/plugins";

describe("content model via code", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
    });
    afterEach(async () => {
        vi.clearAllMocks();
    });

    it("should properly construct content model via code and call build fields", async () => {
        const buildFields = vi.spyOn(CmsModelPlugin.prototype, "buildFields" as never);

        const model = new CmsModelPlugin({
            group: "group",
            name: "Test",
            modelId: "test",
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    label: "Title",
                    type: "text",
                    storageId: "",
                    validation: [],
                    listValidation: []
                },
                {
                    id: "obj",
                    fieldId: "obj",
                    label: "Obj",
                    type: "object",
                    storageId: "",
                    validation: [],
                    listValidation: [],
                    settings: {
                        fields: [
                            {
                                id: "objTitle",
                                fieldId: "objTitle",
                                label: "Obj Title",
                                type: "text",
                                storageId: "",
                                validation: [],
                                listValidation: []
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
        const buildFields = vi.spyOn(CmsModelPlugin.prototype, "buildFields" as never);

        const model = new CmsModelPlugin({
            noValidate: true,
            group: "group",
            name: "Test",
            modelId: "test",
            fields: [
                {
                    id: "title",
                    storageId: "text@title",
                    fieldId: "title",
                    label: "Title",
                    type: "text",
                    validation: [],
                    listValidation: []
                },
                {
                    id: "obj",
                    storageId: "object@obj",
                    fieldId: "obj",
                    label: "Obj",
                    type: "object",
                    validation: [],
                    listValidation: [],
                    settings: {
                        fields: [
                            {
                                id: "objTitle",
                                fieldId: "objTitle",
                                label: "Obj Title",
                                type: "text",
                                storageId: "text@objTitle",
                                validation: [],
                                listValidation: []
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
