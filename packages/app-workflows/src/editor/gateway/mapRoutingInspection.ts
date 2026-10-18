import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RoutingOwner } from "~/editor/domain/types.js";
import type { RoutingSkippedPerson } from "~/editor/domain/types.js";
import type { RoutingTraceEntry } from "~/editor/domain/types.js";
import type { RoutingInspectionDto } from "./dto.js";
import type { RoutingSkippedPersonDto } from "./dto.js";
import type { RoutingTraceEntryDto } from "./dto.js";

const toAssignmentStrategy = (strategy: string): AssignmentStrategy => {
    if (strategy === "roundRobin") {
        return "roundRobin";
    }
    if (strategy === "leastLoaded") {
        return "leastLoaded";
    }
    return "none";
};

const mapTraceEntry = (dto: RoutingTraceEntryDto): RoutingTraceEntry => {
    return {
        ruleId: dto.ruleId,
        outcome: dto.outcome,
        reason: dto.reason ?? null,
        failedConditions: [...(dto.failedConditions ?? [])]
    };
};

const mapSkippedPerson = (dto: RoutingSkippedPersonDto): RoutingSkippedPerson => {
    return {
        userId: dto.userId,
        displayName: dto.displayName ?? null,
        reason: dto.reason
    };
};

export const mapRoutingInspection = (dto: RoutingInspectionDto): RoutingInspection => {
    const owner: RoutingOwner | null = dto.owner
        ? { id: dto.owner.id, displayName: dto.owner.displayName }
        : null;

    return {
        owner,
        source: dto.source,
        ruleId: dto.ruleId ?? null,
        strategy: toAssignmentStrategy(dto.strategy),
        narrowedTeamId: dto.narrowedTeamId ?? null,
        candidateIds: [...(dto.candidateIds ?? [])],
        candidateCount: dto.candidateCount ?? 0,
        trace: dto.trace.map(mapTraceEntry),
        skipped: dto.skipped.map(mapSkippedPerson)
    };
};
