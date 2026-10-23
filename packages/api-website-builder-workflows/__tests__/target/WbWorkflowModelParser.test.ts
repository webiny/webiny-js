import { beforeAll, describe, expect, it } from "vitest";
import { WorkflowModelParserService } from "@webiny/api-workflows/features/model/WorkflowModelParserService/index.js";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import { createContextHandler } from "~tests/__helpers/handler.js";

let parser: WorkflowModelParserService.Interface;

beforeAll(async () => {
    const { container } = await createContextHandler().context();
    parser = container.resolve(WorkflowModelParserService);
});

describe("WbWorkflowModelParser (D137, R113)", () => {
    it("parses wb.page into the wb app and the page model's id", () => {
        expect(parser.parse("wb.page")).toEqual({ app: "wb", modelId: PAGE_MODEL_ID });
    });

    it("parses no other Website Builder model", () => {
        expect(parser.parse("wb.block")).toBeNull();
        expect(parser.parse("wb.")).toBeNull();
    });
});
