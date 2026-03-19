import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/__mocks/handler/useGraphQLHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import {
    PublishTestEntryActionHandler,
    PublishTestEntryActionHandlerImpl
} from "~tests/__mocks/PublishTestEntryActionHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useHandler } from "~tests/__mocks/handler/useHandler.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { ContextPlugin } from "@webiny/api";
import { SCHEDULED_ACTION_PUBLISH } from "~/constants.js";

describe("Scheduler GraphQL", () => {
    const targetId = "target-id#0001";

    const handler = useGraphQLHandler({
        getScheduleClient: () => {
            return createMockScheduleClient();
        },
        plugins: [
            new ContextPlugin(async context => {
                context.container.register(NamespaceHandler);
                context.container.register(PublishTestEntryActionHandler);
            })
        ]
    });

    let context: CmsContext;

    const namespace = PublishTestEntryActionHandlerImpl.name;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        context.container.register(NamespaceHandler);
        context.container.register(PublishTestEntryActionHandler);
    });

    it("should list scheduled actions with no result", async () => {
        const [response] = await handler.listScheduledActions({
            namespace: PublishTestEntryActionHandlerImpl.name
        });

        expect(response).toEqual({
            data: {
                scheduler: {
                    listScheduledActions: {
                        data: [],
                        meta: {
                            totalCount: 0,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should fail to get scheduled action - non existing scheduled action", async () => {
        const [responseNamespace] = await handler.getScheduledAction({
            namespace: "DoesNotExist",
            id: "non-existing-id"
        });

        expect(responseNamespace).toEqual({
            data: {
                scheduler: {
                    getScheduledAction: {
                        data: null,
                        error: null
                    }
                }
            }
        });
        const [response] = await handler.getScheduledAction({
            namespace: PublishTestEntryActionHandlerImpl.name,
            id: "non-existing-id"
        });

        expect(response).toEqual({
            data: {
                scheduler: {
                    getScheduledAction: {
                        data: null,
                        error: null
                    }
                }
            }
        });
    });

    it("should schedule an action", async () => {
        const scheduleFor = new Date(new Date().getTime() + 5 * 60 * 1000);

        const [publishResponse] = await handler.scheduleAction({
            id: targetId,
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: SCHEDULED_ACTION_PUBLISH,
            scheduleFor
        });

        expect(publishResponse).toEqual({
            data: {
                scheduler: {
                    scheduleAction: {
                        data: {
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            id: expect.any(String),
                            namespace,
                            publishOn: scheduleFor.toISOString(),
                            scheduledBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            targetId,
                            title: "Fetched title from handler",
                            unpublishOn: null
                        },
                        error: null
                    }
                }
            }
        });

        const [listResponse] = await handler.listScheduledActions({
            namespace: PublishTestEntryActionHandlerImpl.name,
            sort: ["scheduledFor_DESC"],
            where: {}
        });

        expect(listResponse).toEqual({
            data: {
                scheduler: {
                    listScheduledActions: {
                        data: [
                            {
                                actionType: SCHEDULED_ACTION_PUBLISH,
                                id: expect.any(String),
                                namespace,
                                publishOn: scheduleFor.toISOString(),
                                scheduledBy: {
                                    displayName: "John Doe",
                                    id: "id-12345678",
                                    type: "admin"
                                },
                                targetId,
                                title: "Fetched title from handler",
                                unpublishOn: null
                            }
                        ],
                        meta: {
                            totalCount: 1,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Get scheduled action by ID
         */
        const [getResponse] = await handler.getScheduledAction({
            namespace: PublishTestEntryActionHandlerImpl.name,
            id: publishResponse.data.scheduler.scheduleAction.data!.id
        });

        expect(getResponse).toEqual({
            data: {
                scheduler: {
                    getScheduledAction: {
                        data: {
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            id: expect.any(String),
                            namespace,
                            publishOn: scheduleFor.toISOString(),
                            scheduledBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            targetId,
                            title: "Fetched title from handler",
                            unpublishOn: null
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Get scheduled action by target ID
         */
        const [getTargetResponse] = await handler.getTargetScheduledAction({
            namespace: PublishTestEntryActionHandlerImpl.name,
            id: targetId
        });

        expect(getTargetResponse).toEqual({
            data: {
                scheduler: {
                    getTargetScheduledAction: {
                        data: {
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            id: expect.any(String),
                            namespace,
                            publishOn: scheduleFor.toISOString(),
                            scheduledBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            targetId,
                            title: "Fetched title from handler",
                            unpublishOn: null
                        },
                        error: null
                    }
                }
            }
        });

        const updatedScheduleFor = new Date(new Date().getTime() + 10 * 60 * 1000);

        const [updateResponse] = await handler.scheduleAction({
            id: targetId,
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: SCHEDULED_ACTION_PUBLISH,
            scheduleFor: updatedScheduleFor
        });

        expect(updateResponse).toEqual({
            data: {
                scheduler: {
                    scheduleAction: {
                        data: {
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            id: expect.any(String),
                            namespace,
                            publishOn: updatedScheduleFor.toISOString(),
                            scheduledBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            targetId,
                            title: "Fetched title from handler",
                            unpublishOn: null
                        },
                        error: null
                    }
                }
            }
        });

        const [getUpdatedResponse] = await handler.getScheduledAction({
            namespace: PublishTestEntryActionHandlerImpl.name,
            id: updateResponse.data.scheduler.scheduleAction.data!.id
        });

        expect(getUpdatedResponse).toEqual({
            data: {
                scheduler: {
                    getScheduledAction: {
                        data: {
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            id: expect.any(String),
                            namespace,
                            publishOn: updatedScheduleFor.toISOString(),
                            scheduledBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            targetId,
                            title: "Fetched title from handler",
                            unpublishOn: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should scheduled and cancel an action", async () => {
        const scheduleFor = new Date(new Date().getTime() + 5 * 60 * 1000);

        const [publishResponse] = await handler.scheduleAction({
            id: targetId,
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: SCHEDULED_ACTION_PUBLISH,
            scheduleFor
        });

        expect(publishResponse).toEqual({
            data: {
                scheduler: {
                    scheduleAction: {
                        data: {
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            id: expect.any(String),
                            namespace,
                            publishOn: scheduleFor.toISOString(),
                            scheduledBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            targetId,
                            title: "Fetched title from handler",
                            unpublishOn: null
                        },
                        error: null
                    }
                }
            }
        });

        const [getResponse] = await handler.getScheduledAction({
            namespace: PublishTestEntryActionHandlerImpl.name,
            id: publishResponse.data.scheduler.scheduleAction.data!.id
        });

        expect(getResponse).toEqual({
            data: {
                scheduler: {
                    getScheduledAction: {
                        data: {
                            actionType: SCHEDULED_ACTION_PUBLISH,
                            id: expect.any(String),
                            namespace,
                            publishOn: scheduleFor.toISOString(),
                            scheduledBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            targetId,
                            title: "Fetched title from handler",
                            unpublishOn: null
                        },
                        error: null
                    }
                }
            }
        });

        const [cancelResponse] = await handler.cancelScheduledAction({
            namespace: PublishTestEntryActionHandlerImpl.name,
            id: publishResponse.data.scheduler.scheduleAction.data!.id
        });

        expect(cancelResponse).toEqual({
            data: {
                scheduler: {
                    cancelScheduledAction: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [getCancelledResponse] = await handler.getScheduledAction({
            namespace: PublishTestEntryActionHandlerImpl.name,
            id: publishResponse.data.scheduler.scheduleAction.data!.id
        });

        expect(getCancelledResponse).toEqual({
            data: {
                scheduler: {
                    getScheduledAction: {
                        data: null,
                        error: null
                    }
                }
            }
        });
    });
});
