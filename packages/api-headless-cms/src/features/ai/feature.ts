import { createFeature } from "@webiny/feature/api";
import { ListContentModelsTool } from "./ListContentModelsTool.js";
import { DescribeContentModelTool } from "./DescribeContentModelTool.js";
import { QueryEntriesTool } from "./QueryEntriesTool.js";

/**
 * Read-only CMS tools for AI callers. Registered as `AiSdkTool` implementations, so they are picked
 * up both by in-process `generateText`/`streamText` calls and by the MCP endpoint, which resolves the
 * same abstraction.
 */
export const CmsAiToolsFeature = createFeature({
    name: "HeadlessCms/AiTools",
    register(container) {
        container.register(ListContentModelsTool);
        container.register(DescribeContentModelTool);
        container.register(QueryEntriesTool);
    }
});
