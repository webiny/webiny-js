import type { RuleReferenceEntries } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createEmptyStepFormOptions } from "~/editor/presentation/stepForm/createEmptyStepFormOptions.js";
import type { StepFormAssignmentOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormFoldersOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormListState } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormReferencesOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormRuleErrorsOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormRuleIssuesOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormTargetMembersOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormUsersOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";

export const createAssignmentSlice = (
    overrides: Partial<StepFormAssignmentOptions> = {}
): StepFormAssignmentOptions => {
    return { ...createEmptyStepFormOptions().assignment, ...overrides };
};

export const createUsersSlice = (
    overrides: Partial<StepFormUsersOptions> = {}
): StepFormUsersOptions => {
    return { ...createEmptyStepFormOptions().users, ...overrides };
};

export const createTargetMembersSlice = (
    overrides: Partial<StepFormTargetMembersOptions> = {}
): StepFormTargetMembersOptions => {
    return { ...createEmptyStepFormOptions().targetMembers, ...overrides };
};

export const createFoldersSlice = (
    overrides: Partial<StepFormFoldersOptions> = {}
): StepFormFoldersOptions => {
    return { ...createEmptyStepFormOptions().folders, ...overrides };
};

// The resolved references from `createRuleReferences` entries, and the resolution state on top.
export const createReferencesSlice = (
    entries: RuleReferenceEntries = {},
    state: Partial<StepFormListState> = {}
): StepFormReferencesOptions => {
    return {
        ...createEmptyStepFormOptions().references,
        ...createRuleReferences(entries),
        ...state
    };
};

export const createRuleErrorsSlice = (
    overrides: Partial<StepFormRuleErrorsOptions> = {}
): StepFormRuleErrorsOptions => {
    return { ...createEmptyStepFormOptions().ruleErrors, ...overrides };
};

export const createRuleIssuesSlice = (
    overrides: Partial<StepFormRuleIssuesOptions> = {}
): StepFormRuleIssuesOptions => {
    return { ...createEmptyStepFormOptions().ruleIssues, ...overrides };
};
