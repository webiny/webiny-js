import type { StepCandidateDto } from "./dto.js";
import type { StepCandidate } from "~/review/domain/types.js";

export const mapStepCandidate = (dto: StepCandidateDto): StepCandidate => {
    return {
        id: dto.id,
        displayName: dto.displayName,
        teamNames: dto.teams,
        excluded: dto.excluded,
        excludedReason: dto.excludedReason ?? null
    };
};
