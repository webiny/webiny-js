import { CmsModel, CmsGroup } from "~/types";
import models from "./mocks/contentModels";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { useBugManageHandler } from "../utils/useBugManageHandler";

describe("predefined values", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    const setupContentModelGroup = async (): Promise<CmsGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    const setupBugModel = async (
        contentModelGroup: CmsGroup,
        overrides: Record<string, any> = {}
    ): Promise<CmsModel> => {
        const model = models.find(m => m.modelId === "bug");
        if (!model) {
            throw new Error(`Could not find model "bug".`);
        }
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout,
                ...overrides
            }
        });
        return update.data.updateContentModel.data;
    };

    test("should create an entry with predefined values selected", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupBugModel(contentModelGroup, {});

        const { createBug } = useBugManageHandler({
            ...manageOpts
        });

        const [response] = await createBug({
            data: {
                name: "A hard debuggable bug",
                bugType: "critical",
                bugValue: 2,
                bugFixed: 1
            }
        });

        expect(response).toEqual({
            data: {
                createBug: {
                    data: {
                        id: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        meta: {
                            locked: false,
                            modelId: "bug",
                            publishedOn: null,
                            status: "draft",
                            title: "A hard debuggable bug",
                            version: 1
                        },
                        name: "A hard debuggable bug",
                        bugType: "critical",
                        bugValue: 2,
                        bugFixed: 1
                    },
                    error: null
                }
            }
        });
    });

    test("should fail creating an entry with wrong predefined text value selected", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupBugModel(contentModelGroup, {});

        const { createBug } = useBugManageHandler({
            ...manageOpts
        });

        const [response] = await createBug({
            data: {
                name: "A hard debuggable bug",
                bugType: "nonExistingBugType",
                bugValue: 2,
                bugFixed: 3
            }
        });

        expect(response).toEqual({
            data: {
                createBug: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "bugType",
                                error: "Value sent does not match any of the available predefined values."
                            }
                        ]
                    }
                }
            }
        });
    });

    test("should fail creating an entry with wrong predefined number value selected", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupBugModel(contentModelGroup, {});

        const { createBug } = useBugManageHandler({
            ...manageOpts
        });

        const [response] = await createBug({
            data: {
                name: "A hard debuggable bug",
                bugType: "critical",
                bugValue: 4567,
                bugFixed: 3
            }
        });

        expect(response).toEqual({
            data: {
                createBug: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "bugValue",
                                error: "Value sent does not match any of the available predefined values."
                            }
                        ]
                    }
                }
            }
        });
    });

    test("should fail creating an entry with wrong predefined number and text values selected", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupBugModel(contentModelGroup, {});

        const { createBug } = useBugManageHandler({
            ...manageOpts
        });

        const [response] = await createBug({
            data: {
                name: "A hard debuggable bug",
                bugType: "nonExistingBug",
                bugValue: 4567,
                bugFixed: 3
            }
        });

        expect(response).toEqual({
            data: {
                createBug: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                fieldId: "bugType",
                                error: "Value sent does not match any of the available predefined values."
                            },
                            {
                                fieldId: "bugValue",
                                error: "Value sent does not match any of the available predefined values."
                            }
                        ]
                    }
                }
            }
        });
    });

    test("title should be a selected predefined text value label", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupBugModel(contentModelGroup, {
            titleFieldId: "bugType"
        });

        const { createBug } = useBugManageHandler({
            ...manageOpts
        });

        const [response] = await createBug({
            data: {
                name: "A hard debuggable bug",
                bugType: "critical",
                bugValue: 2,
                bugFixed: 3
            }
        });

        expect(response).toEqual({
            data: {
                createBug: {
                    data: {
                        id: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        meta: {
                            locked: false,
                            modelId: "bug",
                            publishedOn: null,
                            status: "draft",
                            title: "Critical bug!",
                            version: 1
                        },
                        name: "A hard debuggable bug",
                        bugType: "critical",
                        bugValue: 2,
                        bugFixed: 3
                    },
                    error: null
                }
            }
        });
    });

    test("title should be a selected predefined number value label", async () => {
        const contentModelGroup = await setupContentModelGroup();
        await setupBugModel(contentModelGroup, {
            titleFieldId: "bugValue"
        });

        const { createBug } = useBugManageHandler({
            ...manageOpts
        });

        const [response] = await createBug({
            data: {
                name: "A hard debuggable bug",
                bugType: "critical",
                bugValue: 3,
                bugFixed: 3
            }
        });

        expect(response).toEqual({
            data: {
                createBug: {
                    data: {
                        id: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        meta: {
                            locked: false,
                            modelId: "bug",
                            publishedOn: null,
                            status: "draft",
                            title: "High bug value",
                            version: 1
                        },
                        name: "A hard debuggable bug",
                        bugType: "critical",
                        bugValue: 3,
                        bugFixed: 3
                    },
                    error: null
                }
            }
        });
    });

    it("should be able to create an entry with default bug type value", async () => {
        const contentModelGroup = await setupContentModelGroup();
        const bugModel = await setupBugModel(contentModelGroup, {
            titleFieldId: "bugValue"
        });

        const { createBug } = useBugManageHandler({
            ...manageOpts
        });

        const [responseNothing] = await createBug({
            data: {
                name: "A hard debuggable bug - none",
                /**
                 * do not send bug type at all
                 */
                bugValue: 3,
                bugFixed: 3
            }
        });

        expect(responseNothing).toEqual({
            data: {
                createBug: {
                    data: {
                        id: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        meta: {
                            locked: false,
                            modelId: "bug",
                            publishedOn: null,
                            status: "draft",
                            title: "High bug value",
                            version: 1
                        },
                        name: "A hard debuggable bug - none",
                        bugType: "critical",
                        bugValue: 3,
                        bugFixed: 3
                    },
                    error: null
                }
            }
        });
        /**
         * Lets update field default value to something else.
         */
        const fields = bugModel.fields.concat([]);
        for (const field of fields) {
            if (field.fieldId !== "bugType") {
                continue;
            }
            if (!field.settings) {
                field.settings = {};
            }
            field.settings.defaultValue = "when-you-have-time";
        }
        /**
         * Make sure that content model is updated
         */
        const [updateBugModelResponse] = await updateContentModelMutation({
            modelId: bugModel.modelId,
            data: {
                fields,
                layout: bugModel.layout
            }
        });
        expect(updateBugModelResponse).toEqual({
            data: {
                updateContentModel: {
                    data: {
                        ...bugModel,
                        fields,
                        savedOn: expect.stringMatching(/^20/)
                    },
                    error: null
                }
            }
        });

        const [responseUndefined] = await createBug({
            data: {
                name: "A hard debuggable bug - undefined",
                /**
                 * send a bug type as undefined
                 */
                bugType: undefined,
                bugValue: 3,
                bugFixed: 3
            }
        });

        expect(responseUndefined).toEqual({
            data: {
                createBug: {
                    data: {
                        id: expect.any(String),
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        createdBy: {
                            id: "12345678",
                            displayName: "John Doe",
                            type: "admin"
                        },
                        meta: {
                            locked: false,
                            modelId: "bug",
                            publishedOn: null,
                            status: "draft",
                            title: "High bug value",
                            version: 1
                        },
                        name: "A hard debuggable bug - undefined",
                        bugType: "when-you-have-time",
                        bugValue: 3,
                        bugFixed: 3
                    },
                    error: null
                }
            }
        });
    });
});
