import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { TaskLoop } from "~/domain/TaskLoop.js";
import { DispatchingTaskLoop } from "~/loop/DispatchingTaskLoop.js";

type Answer = Record<string, unknown> | Error;

const createEvent = (delay: number): IBackgroundTaskEvent => {
    return {
        webinyTaskId: "task-1",
        webinyTaskDefinitionId: "testDef",
        tenant: "root",
        delay,
        endpoint: "in-process",
        executionName: "task-1",
        stateMachineId: ""
    };
};

/*
 * A dispatcher that answers each iteration from a script and records what it was sent. `finished`
 * resolves once the script runs out, which is when the loop must have stopped.
 */
const createLoop = (answers: Answer[]) => {
    const received: IBackgroundTaskEvent[] = [];
    let finish: () => void = () => {};
    const finished = new Promise<void>(resolve => {
        finish = resolve;
    });

    const dispatcher: EventDispatcher.Interface = {
        dispatch: async <TResult>(event: unknown): Promise<TResult> => {
            const taskEvent = event as IBackgroundTaskEvent;
            received.push(taskEvent);
            const answer = answers.shift();
            if (answers.length === 0) {
                setTimeout(finish, 20);
            }
            if (answer instanceof Error) {
                throw answer;
            }
            return answer as TResult;
        }
    };

    const container = new Container();
    container.registerInstance(EventDispatcher, dispatcher);
    container.register(DispatchingTaskLoop).inSingletonScope();
    const loop = container.resolve(TaskLoop);

    return { loop, received, finished };
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("DispatchingTaskLoop", () => {
    it("runs iterations until the runner answers done", async () => {
        const { loop, received, finished } = createLoop([
            { status: "continue", delay: -1 },
            { status: "continue", delay: -1 },
            { status: "done" }
        ]);

        loop.start(createEvent(0));
        await finished;

        expect(received).toHaveLength(3);
    });

    /*
     * The runner answers an event with `delay > 0` with `continue` and runs nothing. Resending the
     * trigger's delay kept a delayed task in that answer forever.
     */
    it("sends the delay the runner returns, not the trigger's", async () => {
        const { loop, received, finished } = createLoop([
            { status: "continue", wait: 0, delay: -1 },
            { status: "done" }
        ]);

        loop.start(createEvent(30));
        await finished;

        const delays = received.map(event => event.delay);
        expect(delays).toEqual([30, -1]);
    });

    it("waits as long as the runner asks before the next iteration", async () => {
        vi.useFakeTimers();
        const { loop, received } = createLoop([
            { status: "continue", wait: 60, delay: -1 },
            { status: "done" }
        ]);

        loop.start(createEvent(0));
        await vi.advanceTimersByTimeAsync(59_000);
        expect(received).toHaveLength(1);

        await vi.advanceTimersByTimeAsync(1_000);
        expect(received).toHaveLength(2);
        vi.useRealTimers();
    });

    it("stops when the runner answers aborted", async () => {
        const { loop, received, finished } = createLoop([{ status: "aborted" }]);

        loop.start(createEvent(0));
        await finished;

        expect(received).toHaveLength(1);
    });

    it("stops and logs when the runner answers error", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { loop, received, finished } = createLoop([{ status: "error" }]);

        loop.start(createEvent(0));
        await finished;

        expect(received).toHaveLength(1);
        expect(consoleError).toHaveBeenCalledTimes(1);
    });

    it("stops and logs when an iteration throws", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { loop, received, finished } = createLoop([new Error("tenant not found")]);

        loop.start(createEvent(0));
        await finished;

        expect(received).toHaveLength(1);
        expect(consoleError).toHaveBeenCalledTimes(1);
    });
});
