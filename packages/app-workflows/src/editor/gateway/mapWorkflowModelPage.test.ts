import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapWorkflowModelPage } from "./mapWorkflowModelPage.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "~/editor/testing/editorFixtures.js";

describe("mapWorkflowModelPage", () => {
    it("maps the rows and the meta into a page", () => {
        const dto = createWorkflowModelPageDto({
            rows: [
                createWorkflowModelRowDto({
                    model: "cms.article",
                    modelId: "article",
                    name: "Article",
                    workflow: { id: "workflow-1", name: "Article review" }
                }),
                createWorkflowModelRowDto({
                    model: "cms.author",
                    modelId: "author",
                    name: "Author",
                    workflow: null
                })
            ],
            meta: { cursor: "cursor-2", hasMoreItems: true }
        });

        expect(mapWorkflowModelPage(dto)).toEqual({
            rows: [
                {
                    model: "cms.article",
                    modelId: "article",
                    name: "Article",
                    workflow: { id: "workflow-1", name: "Article review" }
                },
                { model: "cms.author", modelId: "author", name: "Author", workflow: null }
            ],
            cursor: "cursor-2",
            hasMoreItems: true
        });
    });

    it("maps a last page and an empty page", () => {
        const page = mapWorkflowModelPage(
            createWorkflowModelPageDto({ rows: [], meta: { cursor: null, hasMoreItems: false } })
        );

        expect(page).toEqual({ rows: [], cursor: null, hasMoreItems: false });
    });

    it("maps an absent cursor to null and an absent workflow to null", () => {
        const row = createWorkflowModelRowDto();
        Reflect.deleteProperty(row, "workflow");
        const dto = createWorkflowModelPageDto({ rows: [row] });
        Reflect.deleteProperty(dto.meta, "cursor");

        const page = mapWorkflowModelPage(dto);

        expect(page.cursor).toBeNull();
        expect(page.rows[0].workflow).toBeNull();
    });
});
