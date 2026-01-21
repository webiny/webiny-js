import { beforeEach, describe, expect, it } from "vitest";
import { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("content model unique model id test", () => {
    const manageHandlerOpts = { path: "manage" };

    const manager = useGraphQLHandler(manageHandlerOpts);

    let contentModelGroup: CmsGroup;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: undefined
        });
        contentModelGroup = result.group;
    });

    it("should not allow creation of a model with an existing modelId", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const eventData = {
            name: "Event",
            modelId: "event",
            singularApiName: "Event",
            pluralApiName: "Events",
            group: contentModelGroup.slug
        };

        const [eventResponse] = await createContentModelMutation({
            data: eventData
        });

        expect(eventResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        ...eventData,
                        group: contentModelGroup.slug
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
            group: contentModelGroup.slug
        };

        const [response] = await createContentModelMutation({
            data: eventsData
        });

        expect(response).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
                        message: 'Content model with modelId "event" already exists.'
                    }
                }
            }
        });
    });

    it("should not allow creation of a model with an existing singularApiName", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const eventData = {
            name: "Event",
            modelId: "event",
            singularApiName: "Event",
            pluralApiName: "Events",
            group: contentModelGroup.slug
        };
        const [eventResponse] = await createContentModelMutation({
            data: eventData
        });

        expect(eventResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        ...eventData,
                        group: contentModelGroup.slug
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
            group: contentModelGroup.slug
        };

        const [singularResponse] = await createContentModelMutation({
            data: eventSingularData
        });

        expect(singularResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
                        message: `Content model with singularApiName "Event" already exists.`
                    }
                }
            }
        });

        const eventPluralData = {
            name: "Events",
            modelId: "events",
            singularApiName: "Events",
            pluralApiName: "EventsPluralized",
            group: contentModelGroup.slug
        };

        const [pluralResponse] = await createContentModelMutation({
            data: eventPluralData
        });

        expect(pluralResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
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
                group: contentModelGroup.slug
            }
        });

        const [singularResponse] = await createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                singularApiName: "EventDifferentThanBefore",
                pluralApiName: "Events",
                group: contentModelGroup.slug
            }
        });

        expect(singularResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
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
                group: contentModelGroup.slug
            }
        });

        expect(pluralResponse).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
                        message: 'Content model with pluralApiName "Events" already exists.'
                    }
                }
            }
        });
    });
});
