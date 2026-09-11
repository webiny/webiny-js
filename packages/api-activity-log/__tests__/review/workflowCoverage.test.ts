import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAPTURED_WORKFLOW_EVENTS, WORKFLOW_OPT_OUT_RULES } from "~/cms/capture/coverage.js";

/**
 * Guard 2, extended to APW. Same failure it exists to catch: a new workflow event appears
 * upstream, nobody subscribes, and the timeline quietly stops describing reviews.
 */

const WORKFLOWS_SRC = join(import.meta.dirname, "../../../api-workflows/src");

const declaredEventTypes = (): string[] => {
    const types = new Set<string>();

    const walk = (dir: string): void => {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);

            if (statSync(path).isDirectory()) {
                if (name !== "__tests__") {
                    walk(path);
                }
                continue;
            }

            if (!name.endsWith(".ts")) {
                continue;
            }

            for (const match of readFileSync(path, "utf8").matchAll(
                /eventType\s*=\s*"(workflow[^"]*)"/g
            )) {
                types.add(match[1]!);
            }
        }
    };

    walk(WORKFLOWS_SRC);

    return [...types].sort();
};

describe("the scan itself", () => {
    it("finds workflow events, so the guard cannot pass vacuously", () => {
        const types = declaredEventTypes();

        expect(types.length).toBeGreaterThan(8);
        expect(types).toContain("workflowState.approveStep");
    });
});

describe("guard 2 (workflows) — every workflow event is captured or opted out", () => {
    const eventTypes = declaredEventTypes();

    const optOutFor = (eventType: string) =>
        WORKFLOW_OPT_OUT_RULES.find(rule => rule.matches(eventType));

    it.each(eventTypes)("%s is captured or opted out", eventType => {
        const captured = Object.hasOwn(CAPTURED_WORKFLOW_EVENTS, eventType);
        const optedOut = optOutFor(eventType) !== undefined;

        expect(
            captured || optedOut,
            `"${eventType}" is neither captured nor opted out. If APW gained a new review ` +
                `action, add a handler and list it in CAPTURED_WORKFLOW_EVENTS.`
        ).toBe(true);
    });

    it.each(eventTypes)("%s is not both captured and opted out", eventType => {
        const captured = Object.hasOwn(CAPTURED_WORKFLOW_EVENTS, eventType);

        expect(captured && optOutFor(eventType) !== undefined).toBe(false);
    });

    it("has no stale entries", () => {
        expect(Object.keys(CAPTURED_WORKFLOW_EVENTS).sort()).toEqual(
            eventTypes.filter(type => Object.hasOwn(CAPTURED_WORKFLOW_EVENTS, type)).sort()
        );
    });

    it("captures every workflowState action event", () => {
        // The five action events plus create and delete. afterUpdate is the one deliberate
        // exclusion, and it has its own opt-out rule with the reasoning.
        const actionEvents = eventTypes.filter(
            type => type.startsWith("workflowState.") && type !== "workflowState.afterUpdate"
        );

        expect(Object.keys(CAPTURED_WORKFLOW_EVENTS).sort()).toEqual(actionEvents.sort());
    });

    it("keeps afterUpdate opted out with a stated reason", () => {
        const rule = optOutFor("workflowState.afterUpdate");

        expect(rule).toBeDefined();
        expect(rule!.reason).toContain("Incomplete");
    });

    it("gives every opt-out rule a reason", () => {
        for (const rule of WORKFLOW_OPT_OUT_RULES) {
            expect(rule.reason.length).toBeGreaterThan(40);
        }
    });
});
