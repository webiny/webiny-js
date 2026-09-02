import { createFeature } from "@webiny/feature/api";
import { ListTeamsTool } from "./ListTeamsTool.js";
import { ListFoldersTool } from "./ListFoldersTool.js";
import { SetFolderPermissionsTool } from "./SetFolderPermissionsTool.js";
import { CreateFolderTool } from "./CreateFolderTool.js";
import { CreateTeamTool } from "./CreateTeamTool.js";
import { ListRolesTool } from "./ListRolesTool.js";

/**
 * Folder and team tools for AI callers. The list tools are read-only and run unattended; anything that
 * creates or changes access is annotated as a write, so it pauses for the user to approve the exact
 * arguments before it runs.
 */
export const AcoAiToolsFeature = createFeature({
    name: "Aco/AiTools",
    register(container) {
        container.register(ListTeamsTool);
        container.register(ListFoldersTool);
        container.register(SetFolderPermissionsTool);
        container.register(CreateFolderTool);
        container.register(CreateTeamTool);
        container.register(ListRolesTool);
    }
});
