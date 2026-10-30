import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { WorkflowUserDto } from "./dto.js";
import type { WorkflowUserListDto } from "./dto.js";

const mapWorkflowUser = (dto: WorkflowUserDto): WorkflowUserSummary => {
    return {
        id: dto.id,
        displayName: dto.displayName,
        teamIds: [...(dto.teamIds ?? [])]
    };
};

export const mapWorkflowUserList = (dto: WorkflowUserListDto): WorkflowUserList => {
    return {
        users: dto.users.map(mapWorkflowUser),
        missingIds: [...dto.missingIds]
    };
};
