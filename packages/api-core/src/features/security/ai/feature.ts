import { createFeature } from "@webiny/feature/api";
import { ListTeamsTool } from "./ListTeamsTool.js";
import { CreateTeamTool } from "./CreateTeamTool.js";
import { UpdateTeamTool } from "./UpdateTeamTool.js";
import { DeleteTeamTool } from "./DeleteTeamTool.js";
import { ListRolesTool } from "./ListRolesTool.js";
import { CreateRoleTool } from "./CreateRoleTool.js";
import { UpdateRoleTool } from "./UpdateRoleTool.js";
import { DeleteRoleTool } from "./DeleteRoleTool.js";

/**
 * Team and role tools for AI callers.
 *
 * The list tools are read-only and run unattended. Creating, changing or deleting a team or a role is
 * a write, so it pauses for the user to approve the exact arguments.
 */
export const SecurityAiToolsFeature = createFeature({
    name: "Security/AiTools",
    register(container) {
        container.register(ListTeamsTool);
        container.register(CreateTeamTool);
        container.register(UpdateTeamTool);
        container.register(DeleteTeamTool);
        container.register(ListRolesTool);
        container.register(CreateRoleTool);
        container.register(UpdateRoleTool);
        container.register(DeleteRoleTool);
    }
});
