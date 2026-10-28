import { CLAIMED_ELSEWHERE_STATUS } from "~/domain/BackgroundTasksLoop.js";
import { HANDED_BACK_STATUS } from "~/domain/BackgroundTasksLoop.js";

// What the handler answers for one iteration; only the fields an execution reads.
export interface IIterationResult {
    status?: string;
    wait?: number;
    delay?: number;
}

export type TaskStep =
    | {
          kind: "continue";
          // How long to wait before the next iteration.
          waitMs: number;
          // The delay the next iteration's event carries.
          delay: number;
      }
    // The task is finished, or is no longer this process's to run.
    | { kind: "end" }
    // The handler answered something an execution does not expect, an error result included.
    | { kind: "unexpected"; status: string | undefined };

// Statuses after which the execution ends without it being an error.
const QUIET_ENDS = new Set(["done", "aborted", CLAIMED_ELSEWHERE_STATUS, HANDED_BACK_STATUS]);

/**
 * Decides what follows one iteration. The standalone counterpart of the `CheckStatus` choice state
 * in the Step Functions definition that drives a task on AWS.
 */
export function nextStep(result: IIterationResult | undefined): TaskStep {
    const status = result?.status;
    if (status && QUIET_ENDS.has(status)) {
        return { kind: "end" };
    }
    if (status !== "continue") {
        return { kind: "unexpected", status };
    }

    /*
     * The first event carries the trigger's delay, and the runner answers it with `continue` and
     * `wait: delay` without running anything. Every later event must carry the delay the runner sent
     * back (-1), as the Step Functions state does on AWS. Resending the original delay would make the
     * runner answer `continue` forever.
     */
    const waitSeconds = result?.wait ?? 0;
    return {
        kind: "continue",
        waitMs: waitSeconds * 1000,
        delay: result?.delay ?? -1
    };
}
