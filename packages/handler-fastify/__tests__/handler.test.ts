import { createHandler } from "~/index";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { BeforeHandlerPlugin, ContextPlugin } from "@webiny/handler";
// import { createHandler as createDefaultHandler } from "@webiny/handler";
import {
    Context,
    HandlerErrorPlugin,
    HandlerPlugin,
    HandlerResultPlugin
} from "@webiny/handler/types";

describe("fastify handler", () => {
    let tracker: LifecycleEventTracker;

    beforeEach(() => {
        tracker = new LifecycleEventTracker();
    });

    it("should construct and trigger handler without any errors", async () => {
        const fn = jest.fn();

        const beforeHandler = new BeforeHandlerPlugin(async () => {
            tracker.track("beforeHandler", {});
        });
        const onHandler: HandlerPlugin = {
            type: "handler",
            handle: async () => {
                tracker.track("onHandler", {});
                await fn();
                return {};
            }
        };
        const handlerError: HandlerErrorPlugin = {
            type: "handler-error",
            handle: async () => {
                tracker.track("onError", {});
            }
        };
        const handlerResult: HandlerResultPlugin = {
            type: "handler-result",
            handle: async () => {
                tracker.track("onResult", {});
            }
        };
        const context = new ContextPlugin<Context>(async () => {
            tracker.track("onContext", {});
        });

        const handler = createHandler({
            plugins: [beforeHandler, onHandler, handlerError, handlerResult, context]
        });

        expect(handler).not.toBeNull();
        expect(handler).toEqual(expect.any(Function));

        await handler();

        expect(fn).toBeCalledTimes(1);

        expect(tracker.isExecutedOnce("beforeHandler")).toBeTruthy();
        expect(tracker.isExecutedOnce("onHandler")).toBeTruthy();
        expect(tracker.isExecutedOnce("onError")).toBeFalsy();
        expect(tracker.isExecutedOnce("onResult")).toBeTruthy();
        expect(tracker.isExecutedOnce("onContext")).toBeTruthy();
    });

    it("should construct and trigger handler with an error", async () => {
        const beforeHandler = new BeforeHandlerPlugin(async () => {
            tracker.track("beforeHandler", {});
        });
        const onHandler: HandlerPlugin = {
            type: "handler",
            handle: async () => {
                tracker.track("onHandler", {});
                throw new Error("We have an error!");
            }
        };
        const handlerError: HandlerErrorPlugin = {
            type: "handler-error",
            handle: async (_, err) => {
                tracker.track("onError", {});
                return {
                    ...err
                };
            }
        };
        const handlerResult: HandlerResultPlugin = {
            type: "handler-result",
            handle: async () => {
                tracker.track("onResult", {});
            }
        };
        const context = new ContextPlugin<Context>(async () => {
            tracker.track("onContext", {});
        });

        const handler = createHandler({
            plugins: [beforeHandler, onHandler, handlerError, handlerResult, context]
        });

        expect(handler).not.toBeNull();
        expect(handler).toEqual(expect.any(Function));

        try {
            await handler();
        } catch {}

        expect(tracker.isExecutedOnce("beforeHandler")).toBeTruthy();
        expect(tracker.isExecutedOnce("onHandler")).toBeTruthy();
        expect(tracker.isExecutedOnce("onError")).toBeTruthy();
        expect(tracker.isExecutedOnce("onResult")).toBeTruthy();
        expect(tracker.isExecutedOnce("onContext")).toBeTruthy();
    });
});
