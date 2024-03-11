import { registry } from "@webiny/handler-aws/registry";
import { createMockEvent } from "~tests/mocks/event";
import { createMockLambdaContext } from "~tests/mocks/lambdaContext";

describe("handler register", () => {
    it("should register source handler", async () => {
        /**
         * Unfortunately it needs to be any because the registry.getHandler method expects certain built-in types.
         */
        const event: any = createMockEvent();
        const context = createMockLambdaContext();

        expect(() => {
            registry.getHandler(event, context);
        }).toThrow(`There is no handler for the event: ${JSON.stringify(event)}`);

        await import(
            /* webpackChunkName: "TestingRegisterWebsocketsHandler" */
            "~/handler/register"
        );

        const result = registry.getHandler(event, context);

        expect(result).toBeDefined();
        expect(result.name).toEqual("handler-webiny-websockets");
        expect(result.canUse(event, context)).toBeTrue();
        expect(result.handle).toBeFunction();
    });
});
