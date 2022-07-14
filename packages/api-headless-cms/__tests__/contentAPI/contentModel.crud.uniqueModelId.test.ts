import { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../utils/useGraphQLHandler";

describe("content model test", () => {
    const manageHandlerOpts = { path: "manage/en-US" };

    const { createContentModelGroupMutation } = useGraphQLHandler(manageHandlerOpts);

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

    test("should not allow creation of a model with an existing modelId", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const eventData = {
            name: "Event",
            modelId: "event",
            group: contentModelGroup.id
        };

        const [eventResponse] = await createContentModelMutation({
            data: eventData
        });

        expect(eventResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        ...eventData,
                        group: {
                            id: contentModelGroup.id,
                            name: contentModelGroup.name
                        }
                    },
                    error: null
                }
            }
        });

        const eventsData = {
            name: "Event",
            modelId: "event",
            group: contentModelGroup.id
        };

        const [response] = await createContentModelMutation({
            data: eventsData
        });

        expect(response).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "MODEL_ID_EXISTS",
                        data: {
                            modelId: "event"
                        },
                        message: 'Content model with modelId "event" already exists.'
                    }
                }
            }
        });
    });

    test("should not allow creation of a model with an existing modelId (plural form of it)", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const eventData = {
            name: "Event",
            modelId: "event",
            group: contentModelGroup.id
        };
        const [eventResponse] = await createContentModelMutation({
            data: eventData
        });

        expect(eventResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        ...eventData,
                        group: {
                            id: contentModelGroup.id,
                            name: contentModelGroup.name
                        }
                    },
                    error: null
                }
            }
        });

        const eventsData = {
            name: "Events",
            modelId: "events",
            group: contentModelGroup.id
        };

        const [response] = await createContentModelMutation({
            data: eventsData
        });

        expect(response).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "MODEL_ID_SINGULAR_ERROR",
                        data: {
                            modelId: "events",
                            singular: "event"
                        },
                        message:
                            'Content model with modelId "events" does not exist, but a model with modelId "event" does.'
                    }
                }
            }
        });
    });

    test("should not allow creation of a model with an existing modelId (singular form of it)", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        await createContentModelMutation({
            data: {
                name: "Events",
                modelId: "events",
                group: contentModelGroup.id
            }
        });

        const [response] = await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                group: contentModelGroup.id
            }
        });

        expect(response).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "MODEL_ID_PLURAL_ERROR",
                        data: {
                            modelId: "event",
                            plural: "events"
                        },
                        message:
                            'Content model with modelId "event" does not exist, but a model with modelId "events" does.'
                    }
                }
            }
        });
    });
});
