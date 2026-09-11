import { createFeature } from "@webiny/feature/api";
import { ListContentModelsTool } from "./ListContentModelsTool.js";
import { DescribeContentModelTool } from "./DescribeContentModelTool.js";
import { QueryEntriesTool } from "./QueryEntriesTool.js";

/**
 * Read-only CMS tools for AI callers. Registered as `AiSdkTool` implementations, so any caller that
 * builds a tool set from that abstraction picks them up without naming them.
 */
export const CmsAiToolsFeature = createFeature({
    name: "HeadlessCms/AiTools",
    register(container) {
        container.register(ListContentModelsTool);
        container.register(DescribeContentModelTool);
        container.register(QueryEntriesTool);
    }
});
