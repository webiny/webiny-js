import { CmsContentModelGroup } from "../../src/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { hooksTracker } from "./mocks/lifecycleHooks";

jest.setTimeout(15000);

describe("content model test", () => {
    const manageHandlerOpts = { path: "manage/en-US" };

    const { clearAllIndex, createContentModelGroupMutation } = useContentGqlHandler(
        manageHandlerOpts
    );

    let contentModelGroup: CmsContentModelGroup;

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
        try {
            await clearAllIndex();
        } catch {
            // Ignore errors
        }
        // we need to reset this since we are using a singleton
        hooksTracker.reset();
    });

    afterEach(async () => {
        try {
            await clearAllIndex();
        } catch {}
    });

    test("should not allow creation of a model with an existing modelId", async () => {
        const { createContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                group: contentModelGroup.id
            }
        });

        await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                group: contentModelGroup.id
            }
        }).then(([response]) => {
            expect(response).toEqual({
                data: {
                    createContentModel: {
                        data: null,
                        error: {
                            code: "",
                            data: null,
                            message: 'Content model with modelId "event" already exists.'
                        }
                    }
                }
            });
        });
    });

    test("should not allow creation of a model with an existing modelId (plural form of it)", async () => {
        const { createContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                group: contentModelGroup.id
            }
        });

        await createContentModelMutation({
            data: {
                name: "Events",
                modelId: "events",
                group: contentModelGroup.id
            }
        }).then(([response]) => {
            expect(response).toEqual({
                data: {
                    createContentModel: {
                        data: null,
                        error: {
                            code: "",
                            data: null,
                            message:
                                'Content model with modelId "events" does not exist, but a model with modelId "event" does.'
                        }
                    }
                }
            });
        });
    });

    test("should not allow creation of a model with an existing modelId (singular form of it)", async () => {
        const { createContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        await createContentModelMutation({
            data: {
                name: "Events",
                modelId: "events",
                group: contentModelGroup.id
            }
        });

        await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                group: contentModelGroup.id
            }
        }).then(([response]) => {
            expect(response).toEqual({
                data: {
                    createContentModel: {
                        data: null,
                        error: {
                            code: "",
                            data: null,
                            message:
                                'Content model with modelId "event" does not exist, but a model with modelId "events" does.'
                        }
                    }
                }
            });
        });
    });

    test("should not allow creation of a model with an existing modelId (auto-generated modelId)", async () => {
        const { createContentModelMutation, listContentModelsQuery } = useContentGqlHandler(
            manageHandlerOpts
        );

        await createContentModelMutation({
            data: {
                name: "Event",
                group: contentModelGroup.id
            }
        });

        await createContentModelMutation({
            data: {
                name: "Event",
                group: contentModelGroup.id
            }
        });

        await listContentModelsQuery().then(([response]) => {
            expect(response).toMatchObject({
                data: {
                    listContentModels: {
                        data: [
                            {
                                modelId: "event"
                            },
                            {
                                modelId: "event1"
                            }
                        ]
                    }
                }
            });
        });
    });

    test("should not allow creation of a model with an existing modelId (auto-generated modelId, plural)", async () => {
        const { createContentModelMutation, listContentModelsQuery } = useContentGqlHandler(
            manageHandlerOpts
        );

        await createContentModelMutation({
            data: {
                name: "Event",
                group: contentModelGroup.id
            }
        });

        await createContentModelMutation({
            data: {
                name: "Events",
                group: contentModelGroup.id
            }
        });

        await listContentModelsQuery().then(([response]) => {
            expect(response).toMatchObject({
                data: {
                    listContentModels: {
                        data: [
                            {
                                modelId: "event"
                            },
                            {
                                modelId: "events1"
                            }
                        ]
                    }
                }
            });
        });
    });

    test("should not allow creation of a model with an existing modelId (auto-generated modelId, singular)", async () => {
        const { createContentModelMutation, listContentModelsQuery } = useContentGqlHandler(
            manageHandlerOpts
        );

        await createContentModelMutation({
            data: {
                name: "Events",
                group: contentModelGroup.id
            }
        });

        await createContentModelMutation({
            data: {
                name: "Event",
                group: contentModelGroup.id
            }
        });

        await listContentModelsQuery().then(([response]) => {
            expect(response).toMatchObject({
                data: {
                    listContentModels: {
                        data: [
                            {
                                modelId: "event1"
                            },
                            {
                                modelId: "events"
                            }
                        ]
                    }
                }
            });
        });
    });
});
