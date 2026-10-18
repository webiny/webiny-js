import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepDrawerPresenter } from "./abstractions.js";

// The three view-model fields the view-level options carry.
export type StepFormOptionsVm = Pick<
    StepDrawerPresenter.ViewModel,
    "ruleErrors" | "ruleIssues" | "testRouting"
>;

// The presenter members the view-level options read and call.
export type StepFormOptionsPresenter = Pick<
    StepDrawerPresenter.Interface,
    "formOptions" | "setTestRequester" | "setTestFolder" | "runTest" | "clearRuleError"
>;

/*
 * The one value every renderer of a step form reads (R234): the presenter's list slices as they are,
 * plus the slices that come from the drawer view model (`ruleErrors`, `ruleIssues`, `testRouting`)
 * with their callbacks bound as plain functions. Nothing here is a React node or a class instance,
 * so MobX never deep-observes a fiber. The drawer view calls it on every render.
 */
export const buildStepFormOptions = (
    vm: StepFormOptionsVm,
    presenter: StepFormOptionsPresenter
): StepFormOptions => {
    const base = presenter.formOptions;

    const ruleErrors: StepFormOptions["ruleErrors"] = {
        items: vm.ruleErrors,
        clearRuleError: ruleId => presenter.clearRuleError(ruleId)
    };

    const ruleIssues: StepFormOptions["ruleIssues"] = {
        items: vm.ruleIssues
    };

    const testRouting: StepFormOptions["testRouting"] = {
        vm: vm.testRouting ?? base.testRouting.vm,
        setTestRequester: id => presenter.setTestRequester(id),
        setTestFolder: id => presenter.setTestFolder(id),
        runTest: () => {
            void presenter.runTest();
        }
    };

    return { ...base, ruleErrors, ruleIssues, testRouting };
};
