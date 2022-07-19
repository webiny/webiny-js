import { createHandler, RoutePlugin } from "~/index";
import { HandlerPlugin } from "@webiny/handler";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { FastifyContext, RouteTypes } from "~/types";

describe("Routes plugin", () => {
    let tracker: LifecycleEventTracker;

    beforeEach(() => {
        tracker = new LifecycleEventTracker();
    });

    it("should add routes and they must be visible in the defined property", async () => {
        const routes = new RoutePlugin(
            async ({ onPost, onGet, onDelete, onOptions, onPatch, onPut }) => {
                onPost("/webiny-post", async () => {
                    throw new Error("This should not fire!");
                });

                onGet("/webiny-get", async () => {
                    throw new Error("This should not fire!");
                });

                onDelete("/webiny-delete", async () => {
                    throw new Error("This should not fire!");
                });

                onOptions("/webiny-options", async () => {
                    throw new Error("This should not fire!");
                });

                onPatch("/webiny-patch", async () => {
                    throw new Error("This should not fire!");
                });

                onPut("/webiny-put", async () => {
                    throw new Error("This should not fire!");
                });
            }
        );

        const handleCall = new HandlerPlugin<FastifyContext>(async context => {
            tracker.track("handle", context.routes.defined);

            return {};
        });

        const handler = createHandler({
            plugins: [handleCall, routes]
        });

        await handler();

        const expected: Record<RouteTypes, string[]> = {
            put: ["/webiny-put"],
            patch: ["/webiny-patch"],
            post: ["/webiny-post"],
            get: ["/webiny-get"],
            delete: ["/webiny-delete"],
            options: ["/webiny-options"]
        };

        expect(tracker.getLast("handle")).toEqual({
            count: 1,
            params: [expected]
        });
    });
});
