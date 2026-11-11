import { beforeAll, describe, expect, it } from "vitest";
import { WorkflowModelParser } from "@webiny/api-workflows/features/model/WorkflowModelParser/index.js";
import { createTestContext } from "~tests/__helpers/testContext.js";

let parser: WorkflowModelParser.Interface;

beforeAll(async () => {
    const context = await createTestContext({ withWorkflow: false });
    // The test context also registers a stand-in Website Builder parser; take the CMS one.
    parser = context.container
        .resolveAll(WorkflowModelParser)
        .find(item => item.parse("cms.article") !== null)!;
});

describe("CmsWorkflowModelParser (D137, R113)", () => {
    it("parses a cms.<modelId> model into the cms app and the model id", () => {
        expect(parser.parse("cms.article")).toEqual({ app: "cms", modelId: "article" });
        expect(parser.parse("cms.blog-post_2")).toEqual({ app: "cms", modelId: "blog-post_2" });
    });

    it("parses no other model", () => {
        expect(parser.parse("cms.")).toBeNull();
        expect(parser.parse("cms.blog.post")).toBeNull();
        expect(parser.parse("wb.page")).toBeNull();
        expect(parser.parse("article")).toBeNull();
    });
});
