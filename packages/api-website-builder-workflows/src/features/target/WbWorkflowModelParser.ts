import { WorkflowModelParser } from "@webiny/api-workflows/features/model/WorkflowModelParser/index.js";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/** The `wb.page` workflow model: the `wb` app and the page model's id (D15, D137, R113). */
class WbWorkflowModelParserImpl implements WorkflowModelParser.Interface {
    public parse(model: string): WorkflowModelParser.Parsed | null {
        return model === WB_PAGE_NAMESPACE ? { app: "wb", modelId: PAGE_MODEL_ID } : null;
    }
}

export const WbWorkflowModelParser = WorkflowModelParser.createImplementation({
    implementation: WbWorkflowModelParserImpl,
    dependencies: []
});
