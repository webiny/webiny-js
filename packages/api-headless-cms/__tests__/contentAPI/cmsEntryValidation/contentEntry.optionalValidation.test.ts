import { describe, expect, it } from "vitest";
import { createValidationStructure } from "~tests/contentAPI/cmsEntryValidation/mocks/structure";
import { useValidationManageHandler } from "~tests/contentAPI/cmsEntryValidation/handler";
import { createTextField } from "./mocks/fields";

describe("content entry skip validation", () => {
    it("should validate required fields by default", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "RequiredTesting",
            fields: [createTextField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage",
            plugins,
            model
        });
        const [response] = await manager.create({
            data: {}
        });
        expect(response).toMatchObject({
            data: {
                create: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
                        data: [
                            {
                                error: "Value is required.",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
    });

    it("should skip all validation when skipValidation is true", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "SkipValidationTesting",
            fields: [createTextField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage",
            plugins,
            model
        });
        const [createResponse] = await manager.create({
            data: {},
            options: {
                skipValidation: true
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
    });

    it("should skip validation on update and create revision", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "UpdateTesting",
            fields: [createTextField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage",
            plugins,
            model
        });
        const [createResponse] = await manager.create({
            data: {},
            options: {
                skipValidation: true
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });
        const { id, entryId } = createResponse.data.create.data;
        const [updateResponse] = await manager.update({
            revision: id,
            data: {},
            options: {
                skipValidation: true
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                update: {
                    data: {
                        id
                    },
                    error: null
                }
            }
        });

        const [createFromResponse] = await manager.createRevision({
            revision: id,
            data: {},
            options: {
                skipValidation: true
            }
        });
        expect(createFromResponse).toMatchObject({
            data: {
                createRevision: {
                    data: {
                        id: `${entryId}#0002`
                    },
                    error: null
                }
            }
        });
    });

    it("should execute validation on publish and return an error", async () => {
        const { plugins, model } = createValidationStructure({
            singularApiName: "PublishTesting",
            fields: [createTextField({})]
        });
        const manager = useValidationManageHandler({
            path: "manage",
            plugins,
            model
        });
        const [createResponse] = await manager.create({
            data: {},
            options: {
                skipValidation: true
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                create: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });

        const [publishResponse] = await manager.publish({
            revision: createResponse.data.create.data.id
        });
        expect(publishResponse).toMatchObject({
            data: {
                publish: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "Cms/Entry/ValidationError",
                        data: [
                            {
                                error: "Value is required.",
                                fieldId: "title",
                                id: "title",
                                parents: [],
                                storageId: "text@title"
                            }
                        ]
                    }
                }
            }
        });
    });
});
