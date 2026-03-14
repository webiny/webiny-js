import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/__mocks/handler/useGraphQLHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { PublishTestEntryActionHandlerImpl } from "~tests/__mocks/PublishTestEntryActionHandler.js";

describe("Scheduler GraphQL", () => {
    const handler = useGraphQLHandler({
        getScheduleClient: () => {
            return createMockScheduleClient();
        }
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
});
