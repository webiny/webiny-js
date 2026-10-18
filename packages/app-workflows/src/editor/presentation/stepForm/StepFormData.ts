// The values of each step form, as `form.getData()` returns them (an untouched text field is null).
import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

export interface CommonFormValues {
    title: string | null;
    color: string | null;
    description: string | null;
    notifications: string[] | null;
}

// The Assignment tab as form values (R293); `strategy` is null for a stored strategy the editor does not know (R314).
export interface AssignmentFormValues {
    strategy: AssignmentStrategy | null;
    allowManualPick: boolean;
    rules: RuleValue[];
}

export interface PeopleFormValues extends CommonFormValues {
    teams: string[] | null;
    assignment: AssignmentFormValues;
}

export interface AutomationFormValues extends CommonFormValues {
    automationId: string | null;
    settings: Record<string, unknown> | null;
}

export interface AiFormValues extends CommonFormValues {
    instructions: string | null;
    model: string | null;
    tools: string[] | null;
}
