import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { TEST_WB_PAGE_MODEL_ID } from "~tests/__helpers/TestWorkflowModelParser.js";
import { WorkflowModelParser } from "~/features/model/WorkflowModelParser/index.js";
import { WorkflowModelParserService } from "~/features/model/WorkflowModelParserService/index.js";

/** A parser of another app, registered after the test parser. */
class BlogWorkflowModelParserImpl implements WorkflowModelParser.Interface {
    public parse(model: string): WorkflowModelParser.Parsed | null {
        return model === "blog.post" ? { app: "blog", modelId: "post" } : null;
    }
}

const BlogWorkflowModelParser = WorkflowModelParser.createImplementation({
    implementation: BlogWorkflowModelParserImpl,
    dependencies: []
});

const createParserService = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            container.register(BlogWorkflowModelParser);
        }
    });
    return context.container.resolve(WorkflowModelParserService);
};

describe("WorkflowModelParserService", () => {
    it("answers with the parser of the model's app", async () => {
        const parser = await createParserService();

        expect(parser.parse("cms.article")).toEqual({ app: "cms", modelId: "article" });
        expect(parser.parse("wb.page")).toEqual({ app: "wb", modelId: TEST_WB_PAGE_MODEL_ID });
        expect(parser.parse("blog.post")).toEqual({ app: "blog", modelId: "post" });
    });

    it("answers null when no app knows the model", async () => {
        const parser = await createParserService();

        expect(parser.parse("foo")).toBeNull();
        expect(parser.parse("wb.block")).toBeNull();
        expect(parser.parse("cms.")).toBeNull();
    });
});
