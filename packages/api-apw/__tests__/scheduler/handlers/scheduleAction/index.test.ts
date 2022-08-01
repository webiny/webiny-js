import { Context } from "@webiny/api";
import { scheduleActionHandlerPlugins } from "~/scheduler/handlers/scheduleAction";
import { HeadlessCMSGraphQL } from "~/scheduler/handlers/executeAction/plugins/HeadlessCMSGraphQL";

describe("schedule action handler", () => {
    it("should not trigger anything as there is no action defined", async () => {
        const context = new Context({
            plugins: [
                scheduleActionHandlerPlugins({
                    storageOperations: {
                        list: async () => {
                            return [
                                [],
                                {
                                    hasMoreItems: false,
                                    totalCount: 0,
                                    cursor: null
                                }
                            ];
                        }
                    } as any
                }),
                new HeadlessCMSGraphQL()
            ],
            WEBINY_VERSION: "w.w.w"
        });
    });
});
