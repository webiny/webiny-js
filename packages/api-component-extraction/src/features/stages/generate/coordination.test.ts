import { describe, expect, it } from "vitest";
import {
    decideCoordination,
    initCoordinatorState,
    type CoordinationConfig,
    type CoordinatorState,
    generateProgressDetail
} from "./coordination.js";

const config: CoordinationConfig = { concurrency: 2, timeoutMs: 1000, maxTriggers: 2 };

describe("decideCoordination", () => {
    it("triggers up to the concurrency budget from a fresh state", () => {
        const state = initCoordinatorState(["a", "b", "c"]);
        const decision = decideCoordination(["a", "b", "c"], state, 100, config);
        expect(decision.toTrigger).toEqual(["a", "b"]);
        expect(decision.counts).toMatchObject({ running: 2, pending: 1, done: 0, failed: 0 });
        expect(decision.done).toBe(false);
    });

    it("does not exceed the budget while children are still running", () => {
        // a, b already triggered; c pending. No slot free.
        const state: CoordinatorState = {
            states: { a: "triggered", b: "triggered", c: "pending" },
            triggeredAt: { a: 100, b: 100 },
            triggers: { a: 1, b: 1, c: 0 }
        };
        const decision = decideCoordination(["a", "b", "c"], state, 200, config);
        expect(decision.toTrigger).toEqual([]);
        expect(decision.counts.running).toBe(2);
    });

    it("fills a freed slot when a child completes", () => {
        // a done (caller flipped it), b running, c pending → one slot free for c.
        const state: CoordinatorState = {
            states: { a: "done", b: "triggered", c: "pending" },
            triggeredAt: { a: 100, b: 100 },
            triggers: { a: 1, b: 1, c: 0 }
        };
        const decision = decideCoordination(["a", "b", "c"], state, 200, config);
        expect(decision.toTrigger).toEqual(["c"]);
        expect(decision.next.states.c).toBe("triggered");
    });

    it("retriggers a silent child that timed out, until maxTriggers", () => {
        const state: CoordinatorState = {
            states: { a: "triggered" },
            triggeredAt: { a: 100 },
            triggers: { a: 1 }
        };
        // now - triggeredAt = 2000 > timeoutMs(1000): a is re-eligible and retriggered (2nd trigger).
        const decision = decideCoordination(["a"], state, 2100, config);
        expect(decision.toTrigger).toEqual(["a"]);
        expect(decision.next.triggers.a).toBe(2);
        expect(decision.next.triggeredAt.a).toBe(2100);
    });

    it("fails a silent child once it has exhausted its triggers", () => {
        const state: CoordinatorState = {
            states: { a: "triggered" },
            triggeredAt: { a: 100 },
            triggers: { a: 2 } // already at maxTriggers
        };
        const decision = decideCoordination(["a"], state, 2100, config);
        expect(decision.toTrigger).toEqual([]);
        expect(decision.next.states.a).toBe("failed");
        expect(decision.done).toBe(true);
    });

    it("reports done only when every component is terminal", () => {
        const state: CoordinatorState = {
            states: { a: "done", b: "failed" },
            triggeredAt: { a: 100, b: 100 },
            triggers: { a: 1, b: 2 }
        };
        const decision = decideCoordination(["a", "b"], state, 5000, config);
        expect(decision.done).toBe(true);
        expect(decision.toTrigger).toEqual([]);
        expect(decision.counts).toMatchObject({ done: 1, failed: 1, running: 0, pending: 0 });
    });

    it("does not mutate the input state", () => {
        const state = initCoordinatorState(["a"]);
        const snapshot = JSON.stringify(state);
        decideCoordination(["a"], state, 100, config);
        expect(JSON.stringify(state)).toBe(snapshot);
    });
});

describe("generateProgressDetail", () => {
    const now = 1_000_000;
    const state = {
        states: { a: "done", b: "done", c: "failed", d: "triggered", e: "triggered", f: "pending" },
        triggeredAt: { d: now - 9 * 60_000, e: now - 30_000 },
        triggers: { d: 2, e: 1 },
        outcomes: { a: "passed", b: "not-passed" }
    } as unknown as Parameters<typeof generateProgressDetail>[0];

    it("counts components that ended without passing, never a failed attempt of one still working", () => {
        const detail = generateProgressDetail(state, signature => signature.toUpperCase(), now);
        // b used its attempts without passing; c's task never answered. d and e are still working,
        // whatever their attempts so far.
        expect(detail).toMatchObject({ passed: 1, notPassed: 2, working: 2, waiting: 1 });
    });

    it("names the component working longest, for how long, and whether it is being retried", () => {
        const detail = generateProgressDetail(state, signature => signature.toUpperCase(), now);
        expect(detail.longestWorking).toEqual({ name: "D", seconds: 540, retrying: true });
    });

    it("carries outcomes through a coordination pass, so the next checkpoint keeps them", () => {
        const decision = decideCoordination(Object.keys(state.states), state, now, {
            concurrency: 4,
            timeoutMs: 60 * 60_000,
            maxTriggers: 3
        });
        expect(decision.next.outcomes).toEqual({ a: "passed", b: "not-passed" });
    });
});
