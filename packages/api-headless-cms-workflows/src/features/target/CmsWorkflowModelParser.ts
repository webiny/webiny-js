import { WorkflowModelParser } from "@webiny/api-workflows/features/model/WorkflowModelParser/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";

/** A `cms.<modelId>` workflow model: the `cms` app and the CMS model id (D15, D137, R113). */
class CmsWorkflowModelParserImpl implements WorkflowModelParser.Interface {
    public parse(model: string): WorkflowModelParser.Parsed | null {
        const modelId = getModelIdFromAppName(model);
        return modelId ? { app: "cms", modelId } : null;
    }
}

export const CmsWorkflowModelParser = WorkflowModelParser.createImplementation({
    implementation: CmsWorkflowModelParserImpl,
    dependencies: []
});
