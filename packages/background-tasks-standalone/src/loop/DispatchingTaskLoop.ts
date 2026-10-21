import { EventDispatcher } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { TaskLoop } from "~/domain/TaskLoop.js";
import { CLAIMED_ELSEWHERE_STATUS } from "~/domain/TaskLoop.js";
import { HANDED_BACK_STATUS } from "~/domain/TaskLoop.js";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { ProcessTimer } from "~/timer/ProcessTimer.js";
import { IterationSlots } from "./IterationSlots.js";

// 24 hours, the most one task may run in total.
const MAX_TASK_DURATION_MS = 86_400_000;

/*
 * Iterations that run at once in this process; the rest wait in line. A task that waits between its
 * iterations holds no slot, so this caps the work being done, not the tasks in progress.
 */
const MAX_RUNNING_ITERATIONS = 5;

// What the runner answers for one iteration; only the fields the loop reads.
interface IIterationResult {
    status?: string;
    wait?: number;
    delay?: number;
}

// Statuses after which the loop stops without it being an error.
const QUIET_STOPS = new Set(["done", "aborted", CLAIMED_ELSEWHERE_STATUS, HANDED_BACK_STATUS]);

/**
 * Each iteration is one dispatched `BackgroundTaskEvent`, handled in a fresh request container like
 * an HTTP request would be. Root singleton: one loop drives every task in the process.
 */
class DispatchingTaskLoopImpl implements TaskLoop.Interface {
    private readonly slots = new IterationSlots(MAX_RUNNING_ITERATIONS);
    // Tasks this loop drives, from start until their loop ends, waits included.
    private readonly active = new Set<string>();
    private readonly running = new Set<Promise<unknown>>();
    // Wakes every loop that is waiting between iterations.
    private readonly wakers = new Set<() => void>();

    public constructor(
        private readonly dispatcher: EventDispatcher.Interface,
        private readonly shutdown: ShutdownSignal.Interface
    ) {}

    public start(event: IBackgroundTaskEvent): void {
        const taskId = event.webinyTaskId;
        if (this.shutdown.isStopping() || this.active.has(taskId)) {
            return;
        }
        this.active.add(taskId);
        void this.run(event).finally(() => {
            this.active.delete(taskId);
        });
    }

    public async stop(timeoutMs: number): Promise<void> {
        // Running iterations hear this through the signal, and hand their task back.
        this.shutdown.stop();
        this.slots.close();
        for (const wake of this.wakers) {
            wake();
        }

        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<void>(resolve => {
            timer = setTimeout(resolve, timeoutMs);
        });
        const iterations = Promise.allSettled([...this.running]);
        await Promise.race([iterations, timeout]);
        clearTimeout(timer);
    }

    private async run(firstEvent: IBackgroundTaskEvent): Promise<void> {
        const taskId = firstEvent.webinyTaskId;
        const timer = new ProcessTimer(MAX_TASK_DURATION_MS);
        let event = firstEvent;

        while (timer.getRemainingMilliseconds() > 0) {
            /*
             * A slot that is not granted means the process is stopping. A task that was waiting keeps
             * its claim, which runs out when it is due, so another process does not run it early.
             */
            const granted = await this.slots.acquire();
            if (!granted) {
                return;
            }

            let result: IIterationResult | undefined;
            const iteration = this.dispatcher.dispatch<IIterationResult>(event);
            this.running.add(iteration);
            try {
                result = await iteration;
            } catch (error) {
                console.error(`Background task "${taskId}" failed:`, error);
                return;
            } finally {
                this.running.delete(iteration);
                this.slots.release();
            }

            const status = result?.status;
            if (status && QUIET_STOPS.has(status)) {
                return;
            }
            if (status !== "continue") {
                console.error(
                    `Background task "${taskId}" stopped with status "${status}":`,
                    result
                );
                return;
            }

            /*
             * The first event carries the trigger's delay, and the runner answers it with `continue`
             * and `wait: delay` without running anything. Every later event must carry the delay the
             * runner sent back (-1), as the Step Functions state does on AWS. Resending the original
             * delay would make the runner answer `continue` forever.
             */
            event = { ...event, delay: result?.delay ?? -1 };

            const wait = result?.wait ?? 0;
            if (wait > 0) {
                await this.sleep(wait * 1000);
            }
            if (this.shutdown.isStopping()) {
                return;
            }
        }

        console.error(`Background task "${taskId}" exceeded the maximum duration.`);
    }

    // A wait the process cuts short when it stops.
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            const wake = () => {
                clearTimeout(timer);
                this.wakers.delete(wake);
                resolve();
            };
            const timer = setTimeout(wake, ms);
            this.wakers.add(wake);
        });
    }
}

export const DispatchingTaskLoop = TaskLoop.createImplementation({
    implementation: DispatchingTaskLoopImpl,
    dependencies: [EventDispatcher, ShutdownSignal]
});
