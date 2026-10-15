import { createFeature } from "@webiny/feature/api";
import { ReadTargetTool } from "./ReadTargetTool/ReadTargetTool.js";
import { UpdateTargetFieldsTool } from "./UpdateTargetFieldsTool/UpdateTargetFieldsTool.js";

/** The two built-in AI tools (R173); a step must allowlist them like any other tool. */
export const BuiltInAiToolsFeature = createFeature({
    name: "Workflows/BuiltInAiTools",
    register(container) {
        container.register(ReadTargetTool);
        container.register(UpdateTargetFieldsTool);
    }
});
