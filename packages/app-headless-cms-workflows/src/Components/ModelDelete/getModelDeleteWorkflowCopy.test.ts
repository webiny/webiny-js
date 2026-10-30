import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getModelDeleteWorkflowCopy } from "./getModelDeleteWorkflowCopy.js";

describe("getModelDeleteWorkflowCopy (UI-18, QBZ-38)", () => {
    it("tells someone with Manage workflows to delete the workflow, with the link", () => {
        expect(
            getModelDeleteWorkflowCopy({
                modelName: "Article",
                workflowName: "Article review",
                canManage: true
            })
        ).toEqual({
            title: "Article has a workflow",
            body: "Delete the workflow “Article review” first, then delete the model.",
            showLink: true
        });
    });

    it("tells anyone else to ask someone with Manage workflows, without the link", () => {
        expect(
            getModelDeleteWorkflowCopy({
                modelName: "Article",
                workflowName: "Article review",
                canManage: false
            })
        ).toEqual({
            title: "Article has a workflow",
            body: "Ask someone with Manage workflows to delete the workflow “Article review” first, then delete the model.",
            showLink: false
        });
    });
});
