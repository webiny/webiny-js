import type { EventDispatcher } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import type { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { ProcessTimer } from "~/timer/ProcessTimer.js";
import type { IterationSlots } from "./IterationSlots.js";
import { nextStep } from "./nextStep.js";
import type { IIterationResult } from "./nextStep.js";

// 24 hours, the most one task may run in total.
const MAX_TASK_DURATION_MS = 86_400_000;

interface ITaskExecutionParams {
    event: IBackgroundTaskEvent;
    dispatcher: EventDispatcher.Interface;
    slots: IterationSlots;
    shutdown: ShutdownSignal.Interface;
}

/**
 * One task, driven from its first iteration until it is done: take a slot, run an iteration, decide
 * what follows, wait as long as the task asked, and run the next. The standalone counterpart of one
 * Step Functions execution on AWS, whose `Run`, `CheckStatus` and `Waiter` states these steps are.
 *
 * Each iteration is one dispatched `BackgroundTaskEvent`, handled in a fresh request container like
 * an HTTP request would be.
 */
export class TaskExecution {
    private readonly params: ITaskExecutionParams;
    private iteration: Promise<unknown> | undefined;
    private wake: (() => void) | undefined;

    public constructor(params: ITaskExecutionParams) {
        this.params = params;
    }

    public async run(): Promise<void> {
        const { dispatcher, slots, shutdown } = this.params;
        const taskId = this.params.event.webinyTaskId;
        const timer = new ProcessTimer(MAX_TASK_DURATION_MS);
        let event = this.params.event;

        while (timer.getRemainingMilliseconds() > 0) {
            /*
             * A slot that is not granted means the process is shutting down. A task that was waiting
             * keeps its claim, which runs out when it is due, so another process does not run it early.
             */
            const granted = await slots.acquire();
            if (!granted) {
                return;
            }

            let result: IIterationResult | undefined;
            const iteration = dispatcher.dispatch<IIterationResult>(event);
            this.iteration = iteration;
            try {
                result = await iteration;
            } catch (error) {
                console.error(`Background task "${taskId}" failed:`, error);
                return;
            } finally {
                this.iteration = undefined;
                slots.release();
            }

            const step = nextStep(result);
            if (step.kind === "end") {
                return;
            }
            if (step.kind === "unexpected") {
                console.error(
                    `Background task "${taskId}" stopped with status "${step.status}":`,
                    result
                );
                return;
            }

            event = { ...event, delay: step.delay };
            if (step.waitMs > 0) {
                await this.sleep(step.waitMs);
            }
            if (shutdown.isShuttingDown()) {
                return;
            }
        }

        console.error(`Background task "${taskId}" exceeded the maximum duration.`);
    }

    /** The iteration being dispatched right now, if there is one. */
    public getRunningIteration(): Promise<unknown> | undefined {
        return this.iteration;
    }

    /** Ends a wait between iterations early. */
    public interrupt(): void {
        this.wake?.();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            const timer = setTimeout(() => {
                this.wake?.();
            }, ms);
            this.wake = () => {
                clearTimeout(timer);
                this.wake = undefined;
                resolve();
            };
        });
    }
}
