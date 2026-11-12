import { createFeature } from "@webiny/feature/api";
import { ListTeamsTool } from "./ListTeamsTool.js";
import { ListFoldersTool } from "./ListFoldersTool.js";
import { GrantFolderAccessTool } from "./GrantFolderAccessTool.js";
import { RevokeFolderAccessTool } from "./RevokeFolderAccessTool.js";
import { CreateFolderTool } from "./CreateFolderTool.js";
import { UpdateFolderTool } from "./UpdateFolderTool.js";
import { DeleteFolderTool } from "./DeleteFolderTool.js";
import { CreateTeamTool } from "./CreateTeamTool.js";
import { UpdateTeamTool } from "./UpdateTeamTool.js";
import { DeleteTeamTool } from "./DeleteTeamTool.js";
import { ListRolesTool } from "./ListRolesTool.js";
import { CreateRoleTool } from "./CreateRoleTool.js";
import { UpdateRoleTool } from "./UpdateRoleTool.js";
import { DeleteRoleTool } from "./DeleteRoleTool.js";

/**
 * Folder, team and role tools for AI callers.
 *
 * The list tools are read-only and run unattended. Anything that creates, renames, moves, deletes or changes access is a write,
 * so it pauses for the user to approve the exact arguments. Access changes are deliberately one target
 * per call — granting and revoking separately means the approval block shows the entire change, rather
 * than a desired end state whose omissions quietly remove somebody's access.
 */
export const AcoAiToolsFeature = createFeature({
    name: "Aco/AiTools",
    register(container) {
        container.register(ListTeamsTool);
        container.register(ListFoldersTool);
        container.register(GrantFolderAccessTool);
        container.register(RevokeFolderAccessTool);
        container.register(CreateFolderTool);
        container.register(UpdateFolderTool);
        container.register(DeleteFolderTool);
        container.register(CreateTeamTool);
        container.register(UpdateTeamTool);
        container.register(DeleteTeamTool);
        container.register(ListRolesTool);
        container.register(CreateRoleTool);
        container.register(UpdateRoleTool);
        container.register(DeleteRoleTool);
    }
});
