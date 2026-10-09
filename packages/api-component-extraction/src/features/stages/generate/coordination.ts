/**
 * The Generate fan-out coordinator — pure decision logic, no I/O.
 *
 * The Generate stage triggers one child task per planned component (bounded concurrency) and re-invokes
 * itself to poll. Each pass: the caller first marks any child whose result artifact has appeared as
 * `done`, then asks this function what to do next — which pending components to trigger (filling the
 * concurrency budget), which timed-out ones to give up on, and whether every component has reached a
 * terminal state. Keeping this pure makes the tricky part — concurrency, timeouts and completion —
 * unit-testable without a live task runtime.
 */

export type ComponentState = "pending" | "triggered" | "done" | "failed";

export interface CoordinatorState {
    /** Per-signature lifecycle state. */
    states: Record<string, ComponentState>;
    /** Epoch ms a signature was last triggered, for the per-child timeout. */
    triggeredAt: Record<string, number>;
    /** How many times a signature has been (re)triggered, to bound retries on a silent child. */
    triggers: Record<string, number>;
    /**
     * How each component ended, recorded once when its result appears: passed every check, or used its
     * attempts without passing (or produced nothing). Absent on checkpoints written before it existed.
     */
    outcomes?: Record<string, "passed" | "not-passed">;
    /** The background task id of each component's latest trigger, so a failed child is seen at once. */
    taskIds?: Record<string, string>;
}

/**
 * A child task that failed or was aborted will never write a result. Treated as timed out now, so the
 * next decision retries it (or fails it once out of triggers) instead of waiting out the timeout: on
 * webiny.com a crashing component cost two 8-minute waits (2026-10-09).
 */
export const expireFailedChildren = (
    state: CoordinatorState,
    failedSignatures: string[]
): CoordinatorState => {
    if (failedSignatures.length === 0) {
        return state;
    }
    const triggeredAt = { ...state.triggeredAt };
    for (const signature of failedSignatures) {
        triggeredAt[signature] = 0;
    }
    return { ...state, triggeredAt };
};

export interface CoordinationConfig {
    /** Max children running at once. */
    concurrency: number;
    /** How long a triggered child may go without producing a result before it's considered lost (ms). */
    timeoutMs: number;
    /** How many times a single component may be triggered before it's marked failed. */
    maxTriggers: number;
}

export interface CoordinationDecision {
    /** The next state to persist. */
    next: CoordinatorState;
    /** Signatures to (re)trigger this pass — the caller fires a child task for each. */
    toTrigger: string[];
    /** Every component has reached a terminal state (done or failed). */
    done: boolean;
    /** Counts for a progress line. */
    counts: { done: number; failed: number; running: number; pending: number };
}

const emptyState = (): CoordinatorState => ({ states: {}, triggeredAt: {}, triggers: {} });

/** Seed a coordinator state for a fresh run: every signature pending, nothing triggered. */
export const initCoordinatorState = (signatures: string[]): CoordinatorState => {
    const state = emptyState();
    for (const signature of signatures) {
        state.states[signature] = "pending";
        state.triggers[signature] = 0;
    }
    return state;
};

/**
 * Decide the next actions. Assumes the caller has already flipped any signatures whose result artifact
 * exists to `done` in `state`. Returns the next state plus the signatures to trigger; never mutates the
 * input.
 */
export const decideCoordination = (
    signatures: string[],
    state: CoordinatorState,
    now: number,
    config: CoordinationConfig
): CoordinationDecision => {
    const states: Record<string, ComponentState> = {};
    const triggeredAt: Record<string, number> = { ...state.triggeredAt };
    const triggers: Record<string, number> = {};
    for (const signature of signatures) {
        states[signature] = state.states[signature] ?? "pending";
        triggers[signature] = state.triggers[signature] ?? 0;
    }

    // A triggered child that has gone silent past the timeout: retry it if it has triggers left,
    // otherwise give up on it. (A child that finished would already be `done` — set by the caller.)
    for (const signature of signatures) {
        if (states[signature] !== "triggered") {
            continue;
        }
        const startedAt = triggeredAt[signature] ?? now;
        if (now - startedAt <= config.timeoutMs) {
            continue;
        }
        states[signature] = triggers[signature] >= config.maxTriggers ? "failed" : "pending";
    }

    const running = signatures.filter(signature => states[signature] === "triggered").length;
    const toTrigger: string[] = [];
    let slots = Math.max(0, config.concurrency - running);
    for (const signature of signatures) {
        if (slots === 0) {
            break;
        }
        if (states[signature] !== "pending") {
            continue;
        }
        states[signature] = "triggered";
        triggeredAt[signature] = now;
        triggers[signature] = (triggers[signature] ?? 0) + 1;
        toTrigger.push(signature);
        slots--;
    }

    const counts = {
        done: signatures.filter(signature => states[signature] === "done").length,
        failed: signatures.filter(signature => states[signature] === "failed").length,
        running: signatures.filter(signature => states[signature] === "triggered").length,
        pending: signatures.filter(signature => states[signature] === "pending").length
    };
    const done = counts.running === 0 && counts.pending === 0;

    return {
        // Outcomes are carried as they are: the next checkpoint is saved from this, and dropping them
        // would lose every component's passed / did-not-pass.
        next: {
            states,
            triggeredAt,
            triggers,
            ...(state.outcomes ? { outcomes: state.outcomes } : {}),
            ...(state.taskIds ? { taskIds: state.taskIds } : {})
        },
        toTrigger,
        done,
        counts
    };
};

/**
 * What the waiting screen shows for Generate, from the coordinator's own state.
 *
 * "Did not pass" counts components that ended without passing: their attempts used up with checks
 * still failing, no output, or a task that never answered. Never a failed attempt of a component still
 * working: most components that pass fail one attempt first, and counting those makes a healthy run
 * look broken.
 *
 * No time estimate. Replayed on two runs, a pace-based estimate was within two minutes on one and 20 to
 * 33 minutes short on the other, where 24 of 25 components settled in 16 minutes and the stage ran to
 * 36 waiting on one silent component. So the screen names the component still working, and for how
 * long, instead.
 */
export interface GenerateProgressDetail {
    passed: number;
    notPassed: number;
    working: number;
    waiting: number;
    /** The component that has been working longest, while any is. */
    longestWorking: { name: string; seconds: number; retrying: boolean } | null;
}

export const generateProgressDetail = (
    state: CoordinatorState,
    nameOf: (signature: string) => string,
    now: number
): GenerateProgressDetail => {
    const signatures = Object.keys(state.states);
    const outcomes = state.outcomes ?? {};
    const working = signatures.filter(signature => state.states[signature] === "triggered");
    const oldest = working
        .map(signature => ({ signature, since: state.triggeredAt[signature] ?? now }))
        .sort((a, b) => a.since - b.since)[0];
    return {
        passed: signatures.filter(
            signature => state.states[signature] === "done" && outcomes[signature] === "passed"
        ).length,
        notPassed: signatures.filter(
            signature =>
                state.states[signature] === "failed" ||
                (state.states[signature] === "done" && outcomes[signature] === "not-passed")
        ).length,
        working: working.length,
        waiting: signatures.filter(signature => state.states[signature] === "pending").length,
        longestWorking: oldest
            ? {
                  name: nameOf(oldest.signature),
                  seconds: Math.max(0, Math.round((now - oldest.since) / 1000)),
                  retrying: (state.triggers[oldest.signature] ?? 0) > 1
              }
            : null
    };
};
