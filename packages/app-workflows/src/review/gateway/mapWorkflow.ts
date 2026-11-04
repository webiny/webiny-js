import type { WorkflowDto } from "./dto.js";
import type { WorkflowStepDto } from "./dto.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { ReviewWorkflowStep } from "~/review/domain/types.js";

const REVIEW_STEP_TYPE = "review";

const readAssignment = (type: string, config: unknown): object | null => {
    if (type !== REVIEW_STEP_TYPE) {
        return null;
    }
    if (typeof config !== "object" || config === null || !("assignment" in config)) {
        return null;
    }
    const assignment = config.assignment;
    if (typeof assignment !== "object" || assignment === null) {
        return null;
    }
    return assignment;
};

/*
 * Mirror of `canPickReviewer` in api-workflows: a manual pick is possible for a review step whose
 * config sets `assignment.allowManualPick` to `true` (R218).
 */
const readAllowManualPick = (type: string, config: unknown): boolean => {
    const assignment = readAssignment(type, config);
    if (!assignment || !("allowManualPick" in assignment)) {
        return false;
    }
    return assignment.allowManualPick === true;
};

/*
 * A review step whose `assignment.strategy` is anything but `none` (`roundRobin`, `leastLoaded`)
 * picks its reviewer itself (R246); a missing or unreadable config is not automatic.
 */
const readAssignedAutomatically = (type: string, config: unknown): boolean => {
    const assignment = readAssignment(type, config);
    if (!assignment || !("strategy" in assignment)) {
        return false;
    }
    return typeof assignment.strategy === "string" && assignment.strategy !== "none";
};

const mapStep = (dto: WorkflowStepDto): ReviewWorkflowStep => {
    return {
        id: dto.id,
        title: dto.title,
        color: dto.color,
        description: dto.description ?? null,
        type: dto.type,
        allowManualPick: readAllowManualPick(dto.type, dto.config),
        assignedAutomatically: readAssignedAutomatically(dto.type, dto.config)
    };
};

// Maps a `WorkflowsWorkflow`: `models` (the bound namespaces) becomes `namespaces`.
export const mapWorkflow = (dto: WorkflowDto): ReviewWorkflow => {
    return {
        id: dto.id,
        name: dto.name,
        namespaces: dto.models,
        steps: dto.steps.map(mapStep)
    };
};
