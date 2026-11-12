import { createFeature } from "@webiny/feature/api";
import { ListContentModelsTool } from "./ListContentModelsTool.js";
import { DescribeContentModelTool } from "./DescribeContentModelTool.js";
import { QueryEntriesTool } from "./QueryEntriesTool.js";
import { CreateEntryTool } from "./CreateEntryTool.js";
import { UpdateEntryTool } from "./UpdateEntryTool.js";
import { PublishEntryTool } from "./PublishEntryTool.js";
import { UnpublishEntryTool } from "./UnpublishEntryTool.js";
import { DeleteEntryTool } from "./DeleteEntryTool.js";
import { NotifyEntryChangeUseCase } from "./NotifyEntryChange/NotifyEntryChangeUseCase.js";

/**
 * CMS tools for AI callers. Registered as `AiSdkToolDefinition` implementations, so any caller that
 * builds a tool set from that abstraction picks them up without naming them.
 *
 * The model and query tools are read-only and run unattended. The entry tools write, so each pauses
 * for the user to approve the exact arguments. None of them deletes permanently: `deleteEntry` moves
 * the entry to the trash bin.
 */
export const CmsAiToolsFeature = createFeature({
    name: "HeadlessCms/AiTools",
    register(container) {
        container.register(ListContentModelsTool);
        container.register(DescribeContentModelTool);
        container.register(QueryEntriesTool);
        container.register(CreateEntryTool);
        container.register(UpdateEntryTool);
        container.register(PublishEntryTool);
        container.register(UnpublishEntryTool);
        container.register(DeleteEntryTool);
        container.register(NotifyEntryChangeUseCase);
    }
});
