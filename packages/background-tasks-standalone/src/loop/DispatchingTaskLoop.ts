import { EventDispatcher } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { TaskLoop } from "~/domain/TaskLoop.js";
import { ProcessTimer } from "~/timer/ProcessTimer.js";

// 24 hours, the most one task may run in total.
const MAX_TASK_DURATION_MS = 86_400_000;

// What the runner answers for one iteration; only the fields the loop reads.
interface IIterationResult {
    status?: string;
    wait?: number;
    delay?: number;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Each iteration is one dispatched `BackgroundTaskEvent`, handled in a fresh request container like
 * an HTTP request would be. Root singleton: one loop drives every task in the process.
 */
class DispatchingTaskLoopImpl implements TaskLoop.Interface {
    public constructor(private readonly dispatcher: EventDispatcher.Interface) {}

    public start(event: IBackgroundTaskEvent): void {
        void this.run(event);
    }

    private async run(firstEvent: IBackgroundTaskEvent): Promise<void> {
        const taskId = firstEvent.webinyTaskId;
        const timer = new ProcessTimer(MAX_TASK_DURATION_MS);
        let event = firstEvent;

        while (timer.getRemainingMilliseconds() > 0) {
            let result: IIterationResult | undefined;
            try {
                result = await this.dispatcher.dispatch<IIterationResult>(event);
            } catch (error) {
                console.error(`Background task "${taskId}" failed:`, error);
                return;
            }

            const status = result?.status;
            if (status === "done" || status === "aborted") {
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
                await sleep(wait * 1000);
            }
        }

        console.error(`Background task "${taskId}" exceeded the maximum duration.`);
    }
}

export const DispatchingTaskLoop = TaskLoop.createImplementation({
    implementation: DispatchingTaskLoopImpl,
    dependencies: [EventDispatcher]
});
