import { describe, expect, it } from "vitest";
import { createEventHandlerPlugin } from "~/worker/handler/eventHandler.js";
import { RawEventHandler } from "@webiny/handler-aws/raw/index.js";
import { createMockContext } from "~tests/mocks/context.js";

describe("eventHandler", () => {
    it("should create an event handler plugin", () => {
        const plugin = createEventHandlerPlugin();

        expect(plugin).toBeInstanceOf(RawEventHandler);
    });

    it("should handle run handle", async () => {
        const plugin = createEventHandlerPlugin();

        const { context, reply, request } = createMockContext();
        const result = await plugin.cb({
            payload: {
                test: true
            },
            context,
            request,
            reply
        });
        expect(result).toEqual(undefined);
    });
});
