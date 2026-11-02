import { vi } from "vitest";
import type { Mock } from "vitest";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import type { TestRoutingVm } from "~/editor/presentation/stepDrawer/abstractions.js";

export interface FakeTestRoutingOptions {
    vm: TestRoutingVm;
    setTestRequester: Mock<(id: string | null) => void>;
    setTestFolder: Mock<(id: string | null) => void>;
    runTest: Mock<() => void>;
}

// An idle Test routing tab: no requester, so the button is disabled and the hint shows.
export const createTestRoutingVm = (overrides: Partial<TestRoutingVm> = {}): TestRoutingVm => {
    return {
        requesterId: null,
        folderId: null,
        canRun: false,
        hint: "Choose a requester to test.",
        buttonLabel: "Test routing",
        status: "idle",
        stale: false,
        result: null,
        errorMessage: null,
        ...overrides
    };
};

// Rule 1 matched and chose a person, rule 2 was not evaluated, one person was skipped.
export const createTestRoutingResultVm = (
    overrides: Partial<TestRoutingResultVm> = {}
): TestRoutingResultVm => {
    return {
        ownerLabel: "Ivan Horvat",
        ownerIcon: "person",
        reason: "Assigned by rule 1",
        trace: [
            {
                ruleId: "r1",
                tag: "Matched",
                label: "Rule 1: If requester is in Marketing → Ivan Horvat",
                reason: "All conditions match."
            },
            {
                ruleId: "r2",
                tag: "Skipped",
                label: "Rule 2: Always → Editors team pool",
                reason: "An earlier rule matched."
            }
        ],
        strategyLine: "Not used: a rule chose the reviewer.",
        skipped: [{ name: "Ana Kovac", reason: "Excluded from reviews." }],
        ...overrides
    };
};

export const createTestRoutingOptions = (
    vm: Partial<TestRoutingVm> = {}
): FakeTestRoutingOptions => {
    return {
        vm: createTestRoutingVm(vm),
        setTestRequester: vi.fn(),
        setTestFolder: vi.fn(),
        runTest: vi.fn()
    };
};
