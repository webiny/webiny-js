import { createFeature } from "@webiny/feature/api";
import { ListFoldersTool } from "./ListFoldersTool.js";
import { GrantFolderAccessTool } from "./GrantFolderAccessTool.js";
import { RevokeFolderAccessTool } from "./RevokeFolderAccessTool.js";
import { CreateFolderTool } from "./CreateFolderTool.js";
import { UpdateFolderTool } from "./UpdateFolderTool.js";
import { DeleteFolderTool } from "./DeleteFolderTool.js";

/**
 * Folder tools for AI callers. The team and role tools live in api-core, next to teams and roles.
 *
 * listFolders is read-only and runs unattended. Anything that creates, renames, moves, deletes or changes access is a write,
 * so it pauses for the user to approve the exact arguments. Access changes are deliberately one target
 * per call — granting and revoking separately means the approval block shows the entire change, rather
 * than a desired end state whose omissions quietly remove somebody's access.
 */
export const AcoAiToolsFeature = createFeature({
    name: "Aco/AiTools",
    register(container) {
        container.register(ListFoldersTool);
        container.register(GrantFolderAccessTool);
        container.register(RevokeFolderAccessTool);
        container.register(CreateFolderTool);
        container.register(UpdateFolderTool);
        container.register(DeleteFolderTool);
    }
});
