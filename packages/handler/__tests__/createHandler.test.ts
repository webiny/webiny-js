import { BeforeHandlerPlugin, createHandler } from "~/index";
import { ContextPlugin } from "~/plugins/ContextPlugin";
import { ContextInterface, HandlerErrorPlugin, HandlerPlugin, HandlerResultPlugin } from "~/types";
import { TriggerTracker } from "./tracker";

describe("createHandler", () => {
    let tracker: TriggerTracker;

    beforeEach(() => {
        tracker = new TriggerTracker();
    });

    it("should create handler factory", async () => {
        const handler = createHandler();

        expect(typeof handler).toEqual("function");
    });

    it("should be able to call handler and have no result", async () => {
        const handler = createHandler([]);

        const result = await handler();

        expect(result).toEqual(undefined);
    });

    it("should be able to call handler and run all other plugins in the line", async () => {
        const beforeHandler = new BeforeHandlerPlugin(async () => {
            tracker.triggerBeforeHandler();
        });
        const onHandler: HandlerPlugin = {
            type: "handler",
            handle: async () => {
                tracker.triggerHandler();
                return {};
            }
        };
        const handlerError: HandlerErrorPlugin = {
            type: "handler-error",
            handle: async () => {
                tracker.triggerHandlerError();
            }
        };
        const handlerResult: HandlerResultPlugin = {
            type: "handler-result",
            handle: async () => {
                tracker.triggerHandlerResult();
            }
        };
        const context = new ContextPlugin<ContextInterface>(async () => {
            tracker.triggerContext();
        });
        const handler = createHandler([
            beforeHandler,
            onHandler,
            context,
            handlerError,
            handlerResult
        ]);

        const result = await handler();

        expect(result).toEqual({});

        expect(tracker.context).toEqual(1);
        expect(tracker.handler).toEqual(1);
        expect(tracker.handlerError).toEqual(0);
        expect(tracker.handlerResult).toEqual(1);
        expect(tracker.beforeHandler).toEqual(1);
    });

    it("should be able to call handler and break with response before executing other plugins", async () => {
        const beforeHandler = new BeforeHandlerPlugin(async () => {
            tracker.triggerBeforeHandler();
        });
        const onHandler: HandlerPlugin = {
            type: "handler",
            handle: async () => {
                tracker.triggerHandler();
                return {};
            }
        };
        const context = new ContextPlugin<ContextInterface>(async context => {
            context.setResult({
                customResult: true
            });
            tracker.triggerContext();
        });

        const handlerResult: HandlerResultPlugin = {
            type: "handler-result",
            handle: async () => {
                tracker.triggerHandlerResult();
            }
        };
        const handlerError: HandlerErrorPlugin = {
            type: "handler-error",
            handle: async () => {
                tracker.triggerHandlerError();
            }
        };

        const handler = createHandler([
            beforeHandler,
            onHandler,
            context,
            handlerError,
            handlerResult
        ]);

        const result = await handler();

        expect(result).toEqual({
            customResult: true
        });

        expect(tracker.context).toEqual(1);
        expect(tracker.handler).toEqual(0);
        expect(tracker.handlerError).toEqual(0);
        expect(tracker.handlerResult).toEqual(1);
        expect(tracker.beforeHandler).toEqual(0);
    });

    it("should exec handler error plugin", async () => {
        const beforeHandler = new BeforeHandlerPlugin(async () => {
            tracker.triggerBeforeHandler();
        });
        const onHandler: HandlerPlugin = {
            type: "handler",
            handle: async () => {
                tracker.triggerHandler();
                throw new Error("test");
            }
        };
        const context = new ContextPlugin<ContextInterface>(async () => {
            tracker.triggerContext();
        });

        const handlerResult: HandlerResultPlugin = {
            type: "handler-result",
            handle: async () => {
                tracker.triggerHandlerResult();
            }
        };
        const handlerError: HandlerErrorPlugin = {
            type: "handler-error",
            handle: async (_, error) => {
                tracker.triggerHandlerError();
                return {
                    error: {
                        message: error.message
                    }
                };
            }
        };

        const handler = createHandler([
            beforeHandler,
            onHandler,
            context,
            handlerError,
            handlerResult
        ]);

        const result = await handler();

        expect(result).toEqual({
            error: {
                message: "test"
            }
        });

        expect(tracker.context).toEqual(1);
        expect(tracker.handler).toEqual(1);
        expect(tracker.handlerError).toEqual(1);
        expect(tracker.handlerResult).toEqual(1);
        expect(tracker.beforeHandler).toEqual(1);
    });
});
