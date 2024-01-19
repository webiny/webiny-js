import { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";

describe("content model test", () => {
    const manageHandlerOpts = { path: "manage/en-US" };

    const { createContentModelGroupMutation } = useGraphQLHandler(manageHandlerOpts);

    let contentModelGroup: CmsGroup;

    beforeEach(async () => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
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
            singularApiName: "Event",
            pluralApiName: "Events",
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
            singularApiName: "Event",
            pluralApiName: "Events",
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
                            input: "event"
                        },
                        message: 'Content model with modelId "event" already exists.'
                    }
                }
            }
        });
    });

    test("should not allow creation of a model with an existing singularApiName", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const eventData = {
            name: "Event",
            modelId: "event",
            singularApiName: "Event",
            pluralApiName: "Events",
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

        const eventSingularData = {
            name: "Events",
            modelId: "events",
            singularApiName: "Event",
            pluralApiName: "EventsPlural",
            group: contentModelGroup.id
        };

        const [singularResponse] = await createContentModelMutation({
            data: eventSingularData
        });

        expect(singularResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "MODEL_SINGULAR_API_NAME_EXISTS",
                        data: {
                            input: "Event"
                        },
                        message: 'Content model with singularApiName "Event" already exists.'
                    }
                }
            }
        });

        const eventPluralData = {
            name: "Events",
            modelId: "events",
            singularApiName: "Events",
            pluralApiName: "EventsPluralized",
            group: contentModelGroup.id
        };

        const [pluralResponse] = await createContentModelMutation({
            data: eventPluralData
        });

        expect(pluralResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "MODEL_PLURAL_API_NAME_EXISTS",
                        data: {
                            input: "Events"
                        },
                        message: 'Content model with pluralApiName "Events" already exists.'
                    }
                }
            }
        });
    });

    it("should not allow creation of a model with an existing pluralApiName", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        await createContentModelMutation({
            data: {
                name: "Events",
                modelId: "events",
                singularApiName: "Event",
                pluralApiName: "Events",
                group: contentModelGroup.id
            }
        });

        const [singularResponse] = await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                singularApiName: "EventDifferentThanBefore",
                pluralApiName: "Events",
                group: contentModelGroup.id
            }
        });

        expect(singularResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "MODEL_PLURAL_API_NAME_EXISTS",
                        data: {
                            input: "Events"
                        },
                        message: 'Content model with pluralApiName "Events" already exists.'
                    }
                }
            }
        });

        const [pluralResponse] = await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                singularApiName: "Events",
                pluralApiName: "EventsWhichIsOk",
                group: contentModelGroup.id
            }
        });

        expect(pluralResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "MODEL_PLURAL_API_NAME_EXISTS",
                        data: {
                            input: "Events"
                        },
                        message: 'Content model with pluralApiName "Events" already exists.'
                    }
                }
            }
        });
    });
});
