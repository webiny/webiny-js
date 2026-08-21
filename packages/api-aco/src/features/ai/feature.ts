import { createFeature } from "@webiny/feature/api";
import { ListTeamsTool } from "./ListTeamsTool.js";
import { ListFoldersTool } from "./ListFoldersTool.js";
import { SetFolderPermissionsTool } from "./SetFolderPermissionsTool.js";

/**
 * Folder access tools for AI callers. The two list tools are read-only and run unattended; setting
 * permissions is annotated as a write and therefore requires explicit user approval.
 */
export const AcoAiToolsFeature = createFeature({
    name: "Aco/AiTools",
    register(container) {
        container.register(ListTeamsTool);
        container.register(ListFoldersTool);
        container.register(SetFolderPermissionsTool);
    }
});
