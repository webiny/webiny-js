import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestRoutingVm } from "~/editor/testing/testRoutingFixtures.js";
import { buildStepFormOptions } from "./buildStepFormOptions.js";
import type { StepFormOptionsPresenter } from "./buildStepFormOptions.js";
import type { StepFormOptionsVm } from "./buildStepFormOptions.js";

const createVm = (): StepFormOptionsVm => {
    return {
        ruleErrors: [
            {
                ruleId: "r1",
                field: "target",
                message: "The target team is not one of the step's reviewing teams."
            }
        ],
        ruleIssues: [
            {
                ruleId: "r2",
                index: 1,
                kind: "warning",
                field: "folder",
                message: "The folder no longer exists."
            }
        ],
        testRouting: createTestRoutingVm({ requesterId: "user-1", canRun: true, hint: null })
    };
};

const createPresenter = () => {
    const formOptions = createStepFormOptions();
    const presenter = {
        formOptions,
        setTestRequester: vi.fn(),
        setTestFolder: vi.fn(),
        runTest: vi.fn().mockResolvedValue(undefined),
        clearRuleError: vi.fn()
    } satisfies StepFormOptionsPresenter;
    return { presenter, formOptions };
};

describe("buildStepFormOptions (R234, R293, R300, R303)", () => {
    it("keeps every list slice of the presenter as it is", () => {
        const { presenter, formOptions } = createPresenter();

        const options = buildStepFormOptions(createVm(), presenter);

        expect(options.teams).toBe(formOptions.teams);
        expect(options.transports).toBe(formOptions.transports);
        expect(options.automations).toBe(formOptions.automations);
        expect(options.aiModels).toBe(formOptions.aiModels);
        expect(options.aiTools).toBe(formOptions.aiTools);
    });

    it("carries the rule errors and the live rule issues of the view model", () => {
        const { presenter } = createPresenter();
        const vm = createVm();

        const options = buildStepFormOptions(vm, presenter);

        expect(options.ruleErrors.items).toEqual(vm.ruleErrors);
        expect(options.ruleIssues.items).toEqual(vm.ruleIssues);
    });

    it("clears a rule error through the presenter", () => {
        const { presenter } = createPresenter();
        const options = buildStepFormOptions(createVm(), presenter);

        options.ruleErrors.clearRuleError("r1");

        expect(presenter.clearRuleError).toHaveBeenCalledTimes(1);
        expect(presenter.clearRuleError).toHaveBeenCalledWith("r1");
    });

    it("carries the Test routing state and binds its three callbacks to the presenter", () => {
        const { presenter } = createPresenter();
        const vm = createVm();
        const options = buildStepFormOptions(vm, presenter);

        expect(options.testRouting.vm).toBe(vm.testRouting);
        options.testRouting.setTestRequester("user-2");
        options.testRouting.setTestRequester(null);
        options.testRouting.setTestFolder("f1");
        const returned = options.testRouting.runTest();

        expect(presenter.setTestRequester.mock.calls).toEqual([["user-2"], [null]]);
        expect(presenter.setTestFolder.mock.calls).toEqual([["f1"]]);
        expect(presenter.runTest).toHaveBeenCalledTimes(1);
        expect(returned).toBeUndefined();
    });

    it("keeps the idle Test routing state of the presenter when the step has none", () => {
        const { presenter, formOptions } = createPresenter();
        const vm: StepFormOptionsVm = { ...createVm(), testRouting: null };

        const options = buildStepFormOptions(vm, presenter);

        expect(options.testRouting.vm).toBe(formOptions.testRouting.vm);
        expect(options.testRouting.vm.status).toBe("idle");
    });

    it("does not change the presenter's own options object", () => {
        const { presenter, formOptions } = createPresenter();
        const before = { ...formOptions };

        buildStepFormOptions(createVm(), presenter);

        expect(formOptions).toEqual(before);
    });

    it("uses the callbacks as plain functions that work when detached", () => {
        const { presenter } = createPresenter();
        const options = buildStepFormOptions(createVm(), presenter);
        const { setTestRequester, runTest } = options.testRouting;

        setTestRequester("user-3");
        runTest();

        expect(presenter.setTestRequester).toHaveBeenCalledWith("user-3");
        expect(presenter.runTest).toHaveBeenCalledTimes(1);
    });
});
