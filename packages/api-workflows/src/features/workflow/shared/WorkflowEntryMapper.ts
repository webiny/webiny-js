import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsIdentity } from "@webiny/api-headless-cms/types/index.js";
import type {
    Workflow,
    WorkflowIdentity,
    WorkflowStep,
    WorkflowStepNotification,
    WorkflowValues
} from "~/domain/workflow/types.js";

export interface WorkflowEntryStep {
    id: string;
    title: string;
    color: string | null;
    description: string | null;
    type: string;
    notifications: WorkflowStepNotification[] | null;
    config: unknown;
}

export interface WorkflowEntryValues {
    name: string;
    models: string[] | null;
    steps: WorkflowEntryStep[] | null;
}

const toIdentity = (identity: CmsIdentity): WorkflowIdentity => {
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    };
};

/** Maps workflows to and from `wbyWorkflow` entries. */
export class WorkflowEntryMapper {
    public static toValues(values: WorkflowValues): WorkflowEntryValues {
        return {
            name: values.name,
            models: [...values.models],
            steps: values.steps.map(step => ({
                id: step.id,
                title: step.title,
                color: step.color,
                description: step.description ?? null,
                type: step.type,
                notifications: step.notifications.map(notification => ({ id: notification.id })),
                config: step.config
            }))
        };
    }

    public static fromEntry(entry: CmsEntry<WorkflowEntryValues>): Workflow {
        const { id } = parseIdentifier(entry.id);
        return {
            id,
            name: entry.values.name,
            models: entry.values.models ?? [],
            steps: (entry.values.steps ?? []).map(step => WorkflowEntryMapper.stepFromEntry(step)),
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            createdBy: toIdentity(entry.createdBy),
            savedBy: toIdentity(entry.savedBy)
        };
    }

    private static stepFromEntry(step: WorkflowEntryStep): WorkflowStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color ?? "",
            ...(step.description ? { description: step.description } : {}),
            type: step.type,
            notifications: (step.notifications ?? []).map(notification => ({
                id: notification.id
            })),
            config: step.config ?? null
        };
    }
}
