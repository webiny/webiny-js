import { CmsContentModel, CmsContentModelGroup } from "../../src/types";
import models from "./mocks/contentModels";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { useBugManageHandler } from "../utils/useBugManageHandler";

describe("predefined values", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    const setupContentModelGroup = async (): Promise<CmsContentModelGroup> => {
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
        contentModelGroup: CmsContentModelGroup,
        overrides: Record<string, any> = {}
    ): Promise<CmsContentModel> => {
        const model = models.find(m => m.modelId === "bug");
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
                            id: "123",
                            displayName: "User 123",
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
                            id: "123",
                            displayName: "User 123",
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
                            id: "123",
                            displayName: "User 123",
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
});
