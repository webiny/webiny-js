import { EventDispatcher } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { BackgroundTasksLoop } from "~/domain/BackgroundTasksLoop.js";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { IterationSlots } from "./IterationSlots.js";
import { TaskExecution } from "./TaskExecution.js";

/*
 * Iterations that run at once in this process; the rest wait in line. A task that waits between its
 * iterations holds no slot, so this caps the work being done, not the tasks in progress.
 */
const MAX_RUNNING_ITERATIONS = 5;

/**
 * Root singleton: runs every background task of the process, one `TaskExecution` per task. This
 * class decides which tasks run and how many iterations at once; how one task is driven is
 * `TaskExecution`'s.
 */
class InProcessBackgroundTasksLoopImpl implements BackgroundTasksLoop.Interface {
    private readonly slots = new IterationSlots(MAX_RUNNING_ITERATIONS);
    // One per task, from `start` until its execution ends, waits included.
    private readonly executions = new Map<string, TaskExecution>();

    public constructor(
        private readonly dispatcher: EventDispatcher.Interface,
        private readonly shutdown: ShutdownSignal.Interface
    ) {}

    public start(event: IBackgroundTaskEvent): void {
        const taskId = event.webinyTaskId;
        if (this.shutdown.isShuttingDown() || this.executions.has(taskId)) {
            return;
        }
        const execution = new TaskExecution({
            event,
            dispatcher: this.dispatcher,
            slots: this.slots,
            shutdown: this.shutdown
        });
        this.executions.set(taskId, execution);
        void execution.run().finally(() => {
            this.executions.delete(taskId);
        });
    }

    public async stop(timeoutMs: number): Promise<void> {
        // Running iterations hear this through the signal, and hand their task back.
        this.shutdown.begin();
        // Executions waiting for a slot are turned away, and ones waiting between iterations end.
        this.slots.close();
        for (const execution of this.executions.values()) {
            execution.interrupt();
        }

        /*
         * Only iterations being dispatched are waited for: saving progress and releasing the claim
         * happen inside them. The rest have ended above, with nothing to save.
         */
        const iterations: Promise<unknown>[] = [];
        for (const execution of this.executions.values()) {
            const iteration = execution.getRunningIteration();
            if (iteration) {
                iterations.push(iteration);
            }
        }

        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<void>(resolve => {
            timer = setTimeout(resolve, timeoutMs);
        });
        const settled = Promise.allSettled(iterations);
        await Promise.race([settled, timeout]);
        clearTimeout(timer);
    }
}

export const InProcessBackgroundTasksLoop = BackgroundTasksLoop.createImplementation({
    implementation: InProcessBackgroundTasksLoopImpl,
    dependencies: [EventDispatcher, ShutdownSignal]
});
