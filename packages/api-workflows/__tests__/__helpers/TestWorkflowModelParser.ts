import { WorkflowModelParser } from "~/features/model/WorkflowModelParser/index.js";

/** The page model id the test parser gives `wb.page`; the real one is Website Builder's. */
export const TEST_WB_PAGE_MODEL_ID = "testWbPage";

/**
 * The app parsers of the CMS and Website Builder workflows packages, for engine tests that have
 * no app adapter: `cms.<modelId>` and `wb.page`.
 */
class TestWorkflowModelParserImpl implements WorkflowModelParser.Interface {
    public parse(model: string): WorkflowModelParser.Parsed | null {
        const cms = model.match(/^cms\.([a-zA-Z0-9_-]+)$/);
        if (cms) {
            return { app: "cms", modelId: cms[1] };
        }
        return model === "wb.page" ? { app: "wb", modelId: TEST_WB_PAGE_MODEL_ID } : null;
    }
}

export const TestWorkflowModelParser = WorkflowModelParser.createImplementation({
    implementation: TestWorkflowModelParserImpl,
    dependencies: []
});
