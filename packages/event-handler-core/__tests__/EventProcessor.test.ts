import { describe, it, expect } from "vitest";
import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import type { IEventType } from "~/features/events/EventType.js";
import { ChildContainerFactory, RootContainerFactory } from "~/features/events/abstractions.js";
import type { IEventHandler } from "~/features/events/EventHandler.js";
import { EventProcessor } from "~/features/events/EventProcessor.js";

describe("EventProcessor (DI-native handler app)", () => {
    class HttpEventType implements IEventType {
        canHandle(e: any): e is any {
            return !!e.method;
        }
        getHandlerAbstraction() {
            return EventHandler;
        }
    }

    const httpType = EventType.createImplementation({
        implementation: HttpEventType,
        dependencies: []
    });

    const httpEvent = { method: "GET", path: "/" };

    const okHandler = () => {
        class OkHandler implements IEventHandler {
            async execute() {
                return "ok";
            }
        }
        return EventHandler.createImplementation({ implementation: OkHandler, dependencies: [] });
    };

    it("dispatches an event like the previous closure", async () => {
        const processor = EventProcessor.init({
            root: container => {
                container.register(httpType);
                container.register(okHandler());
            }
        });

        expect(await processor.process(httpEvent)).toBe("ok");
    });

    it("runs a ChildContainerFactory decorator on every request (the seam)", async () => {
        const calls: string[] = [];

        class CountingChildContainerFactory implements ChildContainerFactory.Interface {
            constructor(private decoratee: ChildContainerFactory.Interface) {}
            async create(root: any, rawArgs: any[]) {
                calls.push("before");
                const child = await this.decoratee.create(root, rawArgs);
                calls.push("after");
                return child;
            }
        }

        const decorator = ChildContainerFactory.createDecorator({
            decorator: CountingChildContainerFactory,
            dependencies: []
        });

        const processor = EventProcessor.init({
            root: container => {
                container.register(httpType);
                container.register(okHandler());
            },
            app: container => {
                container.registerDecorator(decorator);
            }
        });

        expect(await processor.process(httpEvent)).toBe("ok");
        expect(await processor.process(httpEvent)).toBe("ok");

        // Decorator wraps create() once per request (before + after), twice over two invocations.
        expect(calls).toEqual(["before", "after", "before", "after"]);
    });

    it("builds the root container once and reuses it across invocations", async () => {
        let rootBuilds = 0;

        class CountingRootContainerFactory implements RootContainerFactory.Interface {
            constructor(private decoratee: RootContainerFactory.Interface) {}
            async get() {
                const root = await this.decoratee.get();
                rootBuilds++;
                return root;
            }
        }

        let rootSetupCalls = 0;
        const decorator = RootContainerFactory.createDecorator({
            decorator: CountingRootContainerFactory,
            dependencies: []
        });

        const processor = EventProcessor.init({
            root: container => {
                rootSetupCalls++;
                container.register(httpType);
                container.register(okHandler());
            },
            app: container => {
                container.registerDecorator(decorator);
            }
        });

        await processor.process(httpEvent);
        await processor.process(httpEvent);

        // get() is called per request, but the underlying root is built (root setup runs) only once.
        expect(rootBuilds).toBe(2);
        expect(rootSetupCalls).toBe(1);
    });
});
