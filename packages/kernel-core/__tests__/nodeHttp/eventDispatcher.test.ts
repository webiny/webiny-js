import { AsyncLocalStorage } from "node:async_hooks";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Abstraction } from "@webiny/di";
import type { Container } from "@webiny/di";
import { EventDispatcher } from "~/index.js";
import { EventType } from "~/index.js";
import type { IEventHandler } from "~/index.js";
import type { IEventType } from "~/index.js";
import { createServerHandler } from "~/nodeHttp/createServerHandler.js";

interface IPingEvent {
    ping: string;
}

const PingEventHandler = new Abstraction<IEventHandler<IPingEvent, unknown>>("PingEventHandler");

class PingEventTypeImpl implements IEventType<IPingEvent> {
    canHandle(event: any): event is IPingEvent {
        return typeof event?.ping === "string";
    }

    getHandlerAbstraction() {
        return PingEventHandler;
    }
}

const PingEventType = EventType.createImplementation({
    implementation: PingEventTypeImpl,
    dependencies: []
});

// Stands in for the identity and authorization overrides api-core keeps in AsyncLocalStorage.
const requestOverride = new AsyncLocalStorage<string>();

const createDispatcher = async () => {
    let rootContainer: Container | undefined;

    await createServerHandler({
        root: container => {
            container.register(PingEventType);
            container.registerInstance(PingEventHandler, {
                execute: async ctx => {
                    return { pong: ctx.event.ping, override: requestOverride.getStore() };
                }
            });
        },
        onServer: (_server, container) => {
            rootContainer = container;
        }
    });

    return rootContainer!.resolve(EventDispatcher);
};

describe("EventDispatcher on the Node server", () => {
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
            "No event type matched"
        );
    });
});
