import { WorkflowModelParser } from "@webiny/api-workflows/features/model/WorkflowModelParser/index.js";

/** A stand-in for the Website Builder app's parser, so CMS tests can bind `wb.page` (R46). */
class FakeWbWorkflowModelParserImpl implements WorkflowModelParser.Interface {
    public parse(model: string): WorkflowModelParser.Parsed | null {
        return model === "wb.page" ? { app: "wb", modelId: "wbyWbPage" } : null;
    }
}

export const FakeWbWorkflowModelParser = WorkflowModelParser.createImplementation({
    implementation: FakeWbWorkflowModelParserImpl,
    dependencies: []
});
