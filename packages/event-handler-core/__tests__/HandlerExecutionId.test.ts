import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { EventHandler } from "~/features/events/EventHandler.js";
import type { EventContext } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import { HandlerApp } from "~/features/events/HandlerApp.js";
import { HandlerExecutionId } from "~/features/events/HandlerExecutionId.js";
import { HandlerPlatform } from "~/features/events/HandlerPlatform.js";

// A platform whose invocation id is the event's `id`.
class EventIdPlatform implements HandlerPlatform.Interface {
    bind() {}

    getExecutionId(rawArgs: any[]): string | undefined {
        return rawArgs[0].id;
    }
}

const eventIdPlatform = HandlerPlatform.createImplementation({
    implementation: EventIdPlatform,
    dependencies: []
});

class AnyEventType implements EventType.Interface {
    canHandle(_event: any): _event is any {
        return true;
    }
    getHandlerAbstraction() {
        return EventHandler;
    }
}

const anyEventType = EventType.createImplementation({
    implementation: AnyEventType,
    dependencies: []
});

interface ITestEvent {
    id: string;
    // Resolves when the execution may read its id again.
    resume: Promise<void>;
}

/*
 * Reads the current id through a service registered in the ROOT container (as the logger does),
 * before and after waiting, so another execution can run in between.
 */
class ReadIdsHandler implements EventHandler.Interface<ITestEvent> {
    constructor(private executionId: HandlerExecutionId.Interface) {}

    async execute(ctx: EventContext<ITestEvent>) {
        const before = this.executionId.getId();
        await ctx.event.resume;
        const after = this.executionId.getId();
        return [before, after];
    }
}

const readIdsHandler = EventHandler.createImplementation({
    implementation: ReadIdsHandler,
    dependencies: [HandlerExecutionId]
});

const createApp = () => {
    return HandlerApp.init({
        platform: eventIdPlatform,
        root: container => {
            container.register(anyEventType);
            container.register(readIdsHandler);
        }
    });
};

describe("HandlerExecutionId", () => {
    it("gives each of two interleaved executions its own id", async () => {
        const app = createApp();
        let resumeFirst = () => {};
        const firstResume = new Promise<void>(resolve => {
            resumeFirst = resolve;
        });

        // The first execution waits; the second runs to the end in the meantime.
        const first = app.handle({ id: "first", resume: firstResume });
        const secondResume = Promise.resolve();
        const second = await app.handle({ id: "second", resume: secondResume });
        resumeFirst();

        expect(await first).toEqual(["first", "first"]);
        expect(second).toEqual(["second", "second"]);
    });

    it("has no id outside an execution", async () => {
        const app = createApp();
        const root = await app.getRootContainer();

        const executionId = root.resolve(HandlerExecutionId);

        expect(executionId.getId()).toBeUndefined();
    });
});
