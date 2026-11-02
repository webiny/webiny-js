import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { StepDrawerPresenter } from "~/editor/presentation/stepDrawer/abstractions.js";
import { StepDrawerPresenterFeature } from "~/editor/presentation/stepDrawer/feature.js";
import type { AssignmentFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

export interface DrawerSetup {
    presenter: StepDrawerPresenter.Interface;
    source: FakeStepDrawerSource;
}

// The real drawer presenter over a fake source holding these steps; `configure` adjusts the source.
export const createDrawerSetup = (
    steps: EditorStep[],
    configure?: (source: FakeStepDrawerSource) => void
): DrawerSetup => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
    const source = new FakeStepDrawerSource(steps);
    if (configure) {
        configure(source);
    }
    return { presenter, source };
};

// A People step `step-1` with two rules that target the users `user-1` and `user-2`.
export const createTwoRulesStep = (): EditorStep => {
    return createRoutingStep([
        createStoredRule({ id: "r-1", target: { type: "user", id: "user-1" } }),
        createStoredRule({ id: "r-2", target: { type: "user", id: "user-2" } })
    ]);
};

// The id of the tab the form shows, null for a form without tabs.
export const getActiveTab = (presenter: StepDrawerPresenter.Interface): string | null => {
    const form = presenter.vm.form;
    if (form === null) {
        return null;
    }
    for (const node of form.layout) {
        if (node.type === "tabs") {
            return node.activeTabId;
        }
    }
    return null;
};

export const setActiveTab = (presenter: StepDrawerPresenter.Interface, id: string): void => {
    const form = presenter.vm.form;
    if (form === null) {
        return;
    }
    for (const node of form.layout) {
        if (node.type === "tabs") {
            node.setActiveTab(id);
        }
    }
};

export const withTarget = (rule: RuleValue, type: "user" | "team", id: string): RuleValue => {
    return { ...rule, target: { type, id } };
};

// Edits the rules of the open People form as an admin does.
export const editRules = (
    presenter: StepDrawerPresenter.Interface,
    update: (rules: RuleValue[]) => RuleValue[]
): void => {
    const form = presenter.vm.form;
    if (form === null) {
        throw new Error("The form is not open.");
    }
    const data = form.getData();
    const assignment = data.assignment as AssignmentFormValues;
    form.setData(
        { ...data, assignment: { ...assignment, rules: update(assignment.rules) } },
        { dirty: true }
    );
};

export const editAssignment = (
    presenter: StepDrawerPresenter.Interface,
    patch: Partial<AssignmentFormValues>
): void => {
    const form = presenter.vm.form;
    if (form === null) {
        throw new Error("The form is not open.");
    }
    const data = form.getData();
    const assignment = data.assignment as AssignmentFormValues;
    form.setData({ ...data, assignment: { ...assignment, ...patch } }, { dirty: true });
};

export const editTeams = (presenter: StepDrawerPresenter.Interface, teams: string[]): void => {
    const form = presenter.vm.form;
    if (form === null) {
        throw new Error("The form is not open.");
    }
    form.setData({ ...form.getData(), teams }, { dirty: true });
};

// References where this user is known to be gone (a deleted target, R298).
export const deletedUser = (id: string) => {
    return createRuleReferences({ users: [{ id, label: "Deleted user", state: "deleted" }] });
};
