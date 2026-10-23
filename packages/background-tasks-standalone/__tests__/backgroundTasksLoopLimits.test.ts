import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { BackgroundTasksLoop } from "~/domain/BackgroundTasksLoop.js";
import { HANDED_BACK_STATUS } from "~/domain/BackgroundTasksLoop.js";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { BackgroundTasksLoop as LoopImplementation } from "~/loop/BackgroundTasksLoop.js";
import { ProcessShutdownSignal } from "~/shutdown/ProcessShutdownSignal.js";

type Answer = Record<string, unknown>;

interface IPendingIteration {
    taskId: string;
    answer: (answer: Answer) => void;
}

const createEvent = (taskId: string): IBackgroundTaskEvent => {
    return {
        webinyTaskId: taskId,
        webinyTaskDefinitionId: "testDef",
        tenant: "root",
        delay: 0,
        endpoint: "in-process",
        executionName: taskId,
        stateMachineId: ""
    };
};

/*
 * A dispatcher whose iterations run until the test answers them, so it can see how many run at
 * once. With `stopOnShutdown`, an iteration answers `handed-back` as soon as the process stops, as
 * the real handler does.
 */
const createLoop = (options: { stopOnShutdown?: boolean } = {}) => {
    const pending: IPendingIteration[] = [];
    const container = new Container();
    container.register(ProcessShutdownSignal).inSingletonScope();
    const shutdown = container.resolve(ShutdownSignal);

    const dispatcher: EventDispatcher.Interface = {
        dispatch: <TResult>(event: unknown): Promise<TResult> => {
            const taskEvent = event as IBackgroundTaskEvent;
            return new Promise<TResult>(resolve => {
                const answer = (value: Answer) => resolve(value as TResult);
                pending.push({ taskId: taskEvent.webinyTaskId, answer });
                if (options.stopOnShutdown) {
                    shutdown.onStop(() => answer({ status: HANDED_BACK_STATUS }));
                }
            });
        }
    };

    container.registerInstance(EventDispatcher, dispatcher);
    container.register(LoopImplementation).inSingletonScope();
    const loop = container.resolve(BackgroundTasksLoop);

    // Lets the loop's promises settle.
    const settle = () => vi.advanceTimersByTimeAsync(0);

    return { loop, pending, settle };
};

afterEach(() => {
    vi.useRealTimers();
});

describe("BackgroundTasksLoop limits", () => {
    it("runs at most five iterations at once, and starts the next as one ends", async () => {
        vi.useFakeTimers();
        const { loop, pending, settle } = createLoop();

        for (let i = 1; i <= 7; i++) {
            loop.start(createEvent(`task-${i}`));
        }
        await settle();
        expect(pending.map(p => p.taskId)).toEqual([
            "task-1",
            "task-2",
            "task-3",
            "task-4",
            "task-5"
        ]);

        pending[0].answer({ status: "done" });
        await settle();

        expect(pending).toHaveLength(6);
        expect(pending[5].taskId).toBe("task-6");
    });

    // Recovery can hand the loop a task it is already driving, for example one still in line.
    it("ignores a task it is already driving", async () => {
        vi.useFakeTimers();
        const { loop, pending, settle } = createLoop();

        loop.start(createEvent("task-1"));
        loop.start(createEvent("task-1"));
        await settle();

        expect(pending).toHaveLength(1);
    });

    it("drives the same task again once its loop has ended", async () => {
        vi.useFakeTimers();
        const { loop, pending, settle } = createLoop();
        loop.start(createEvent("task-1"));
        await settle();
        pending[0].answer({ status: "done" });
        await settle();

        loop.start(createEvent("task-1"));
        await settle();

        expect(pending).toHaveLength(2);
    });

    it("waits for running iterations to hand their task back when stopping", async () => {
        vi.useFakeTimers();
        const { loop, pending, settle } = createLoop({ stopOnShutdown: true });
        loop.start(createEvent("task-1"));
        await settle();

        let stopped = false;
        void loop.stop(5000).then(() => {
            stopped = true;
        });
        await settle();

        expect(stopped).toBe(true);
        expect(pending).toHaveLength(1);
    });

    it("gives up waiting after the timeout", async () => {
        vi.useFakeTimers();
        // These iterations ignore the shutdown and never answer.
        const { loop, settle } = createLoop();
        loop.start(createEvent("task-1"));
        await settle();

        let stopped = false;
        void loop.stop(5000).then(() => {
            stopped = true;
        });
        await vi.advanceTimersByTimeAsync(4999);
        expect(stopped).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        expect(stopped).toBe(true);
    });

    it("starts nothing new once stopping, and drops what was waiting in line", async () => {
        vi.useFakeTimers();
        const { loop, pending, settle } = createLoop({ stopOnShutdown: true });
        for (let i = 1; i <= 6; i++) {
            loop.start(createEvent(`task-${i}`));
        }
        await settle();

        await loop.stop(5000);
        loop.start(createEvent("task-7"));
        await settle();

        // Five ran and handed back; the sixth, waiting in line, never ran; the seventh never started.
        expect(pending.map(p => p.taskId)).not.toContain("task-6");
        expect(pending.map(p => p.taskId)).not.toContain("task-7");
        expect(pending).toHaveLength(5);
    });

    // A task waiting between iterations keeps its claim, so it simply stops here.
    it("cuts a wait between iterations short when stopping", async () => {
        vi.useFakeTimers();
        const { loop, pending, settle } = createLoop();
        loop.start(createEvent("task-1"));
        await settle();
        pending[0].answer({ status: "continue", wait: 3600, delay: -1 });
        await settle();

        await loop.stop(5000);
        await vi.advanceTimersByTimeAsync(3_600_000);

        expect(pending).toHaveLength(1);
    });
});
