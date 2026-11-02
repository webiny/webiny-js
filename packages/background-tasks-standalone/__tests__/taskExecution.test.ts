import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import type { EventDispatcher } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { ProcessShutdownSignal } from "~/shutdown/ProcessShutdownSignal.js";
import { IterationSlots } from "~/loop/IterationSlots.js";
import { TaskExecution } from "~/loop/TaskExecution.js";

type Answer = Record<string, unknown> | Error;

const event: IBackgroundTaskEvent = {
    webinyTaskId: "task-1",
    webinyTaskDefinitionId: "testDef",
    tenant: "root",
    delay: 30,
    endpoint: "in-process",
    executionName: "task-1",
    stateMachineId: ""
};

/*
 * An execution with a dispatcher that answers each iteration from a script, recording each event it
 * was sent and how many slots were in use while it ran.
 */
const createExecution = (answers: Answer[], slotCount = 1) => {
    const sent: IBackgroundTaskEvent[] = [];
    const slotsInUse: number[] = [];
    const slots = new IterationSlots(slotCount);
    const container = new Container();
    container.register(ProcessShutdownSignal).inSingletonScope();
    const shutdown = container.resolve(ShutdownSignal);

    const dispatcher: EventDispatcher.Interface = {
        dispatch: async <TResult>(dispatched: unknown): Promise<TResult> => {
            sent.push(dispatched as IBackgroundTaskEvent);
            slotsInUse.push(slots.getRunning());
            const answer = answers.shift() ?? { status: "done" };
            if (answer instanceof Error) {
                throw answer;
            }
            return answer as TResult;
        }
    };

    const execution = new TaskExecution({ event, dispatcher, slots, shutdown });
    return { execution, sent, slotsInUse, slots, shutdown };
};

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("TaskExecution", () => {
    it("holds a slot while each iteration runs and gives it back after", async () => {
        const { execution, slotsInUse, slots } = createExecution([
            { status: "continue", delay: -1 },
            { status: "done" }
        ]);

        await execution.run();

        expect(slotsInUse).toEqual([1, 1]);
        expect(slots.getRunning()).toBe(0);
    });

    it("gives the slot back when the iteration throws", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const { execution, slots } = createExecution([new Error("tenant not found")]);

        await execution.run();

        expect(slots.getRunning()).toBe(0);
    });

    it("sends the next iteration the delay the runner returned", async () => {
        const { execution, sent } = createExecution([
            { status: "continue", delay: -1 },
            { status: "done" }
        ]);

        await execution.run();

        expect(sent.map(e => e.delay)).toEqual([30, -1]);
    });

    it("waits as long as the task asked before the next iteration", async () => {
        vi.useFakeTimers();
        const { execution, sent } = createExecution([
            { status: "continue", wait: 60, delay: -1 },
            { status: "done" }
        ]);

        const running = execution.run();
        await vi.advanceTimersByTimeAsync(59_000);
        expect(sent).toHaveLength(1);

        await vi.advanceTimersByTimeAsync(1_000);
        await running;
        expect(sent).toHaveLength(2);
    });

    it("shows the iteration being dispatched, and nothing once it is done", async () => {
        let finish: (answer: Record<string, unknown>) => void = () => {};
        const container = new Container();
        container.register(ProcessShutdownSignal).inSingletonScope();
        const dispatcher: EventDispatcher.Interface = {
            dispatch: <TResult>() =>
                new Promise<TResult>(resolve => {
                    finish = answer => resolve(answer as TResult);
                })
        };
        const execution = new TaskExecution({
            event,
            dispatcher,
            slots: new IterationSlots(1),
            shutdown: container.resolve(ShutdownSignal)
        });

        const running = execution.run();
        await vi.waitFor(() => expect(execution.getRunningIteration()).toBeDefined());

        finish({ status: "done" });
        await running;
        expect(execution.getRunningIteration()).toBeUndefined();
    });

    // Once the shutdown has begun, an interrupted wait ends the execution; it does not dispatch again.
    it("ends after an interrupted wait once the shutdown has begun", async () => {
        vi.useFakeTimers();
        const { execution, sent, shutdown } = createExecution([
            { status: "continue", wait: 3600, delay: -1 }
        ]);

        const running = execution.run();
        await vi.advanceTimersByTimeAsync(0);
        shutdown.begin();
        execution.interrupt();
        await running;

        expect(sent).toHaveLength(1);
    });

    it("does not run when the slots are closed", async () => {
        const { execution, sent, slots } = createExecution([]);
        slots.close();

        await execution.run();

        expect(sent).toHaveLength(0);
    });

    it("gives up after 24 hours and says so", async () => {
        vi.useFakeTimers();
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const answers: Answer[] = [];
        for (let i = 0; i < 30; i++) {
            answers.push({ status: "continue", wait: 3600, delay: -1 });
        }
        const { execution } = createExecution(answers);

        const running = execution.run();
        await vi.advanceTimersByTimeAsync(25 * 3_600_000);
        await running;

        expect(consoleError).toHaveBeenCalledWith(
            'Background task "task-1" exceeded the maximum duration.'
        );
    });
});
