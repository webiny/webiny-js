import { AsyncLocalStorage } from "node:async_hooks";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Abstraction } from "@webiny/di";
import type { Container } from "@webiny/di";
import { InputDispatcher } from "~/index.js";
import { InputType } from "~/index.js";
import type { InputHandler } from "~/index.js";

import { createServerHandler } from "~/nodeHttp/createServerHandler.js";

interface IPingEvent {
    ping: string;
}

const PingInputHandler = new Abstraction<InputHandler.Interface<IPingEvent, unknown>>(
    "PingInputHandler"
);

class PingInputTypeImpl implements InputType.Interface<IPingEvent> {
    matches(input: any): input is IPingEvent {
        return typeof input?.ping === "string";
    }

    getHandlerAbstraction() {
        return PingInputHandler;
    }
}

const PingInputType = InputType.createImplementation({
    implementation: PingInputTypeImpl,
    dependencies: []
});

// Stands in for the identity and authorization overrides api-core keeps in AsyncLocalStorage.
const requestOverride = new AsyncLocalStorage<string>();

const createDispatcher = async () => {
    let rootContainer: Container | undefined;

    await createServerHandler({
        root: container => {
            container.register(PingInputType);
            container.registerInstance(PingInputHandler, {
                execute: async ctx => {
                    return { pong: ctx.input.ping, override: requestOverride.getStore() };
                }
            });
        },
        onServer: (_server, container) => {
            rootContainer = container;
        }
    });

    return rootContainer!.resolve(InputDispatcher);
};

describe("InputDispatcher on the Node server", () => {
    it("runs a dispatched event through its handler and returns the result", async () => {
        const dispatcher = await createDispatcher();

        const result = await dispatcher.dispatch({ ping: "hello" });

        expect(result).toEqual({ pong: "hello", override: undefined });
    });

    it("does not carry the caller's async context into the dispatched event", async () => {
        const dispatcher = await createDispatcher();

        const result = await requestOverride.run("without-authorization", () => {
            return dispatcher.dispatch({ ping: "hello" });
        });

        expect(result).toEqual({ pong: "hello", override: undefined });
    });

    it("rejects an event no event type recognises", async () => {
        const dispatcher = await createDispatcher();

        await expect(dispatcher.dispatch({ unknown: true })).rejects.toThrow(
            "No input type matched"
        );
    });
});
