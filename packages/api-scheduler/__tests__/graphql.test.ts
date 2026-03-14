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
});
