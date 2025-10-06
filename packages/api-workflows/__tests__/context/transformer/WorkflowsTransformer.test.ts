import { describe, expect, it } from "vitest";
import { WorkflowsTransformer } from "~/context/transformer/index.js";
import type { IWorkflow } from "~/types.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";

describe("Workflows Transformer", () => {
    const transformer = new WorkflowsTransformer();

    it("should transform workflow data correctly", () => {
        const workflow: IWorkflow = {
            id: "id-1234",
            app: "my-app",
            name: "My Workflow",
            steps: [
                {
                    id: "step-1",
                    title: "Step 1",
                    color: "blue",
                    teams: [{ id: "team-1" }],
                    notifications: [{ id: "notif-1" }]
                }
            ]
        };

        const result = transformer.toCmsEntry(workflow);

        expect(result).toEqual({
            id: "id-1234",
            app: "my-app",
            name: "My Workflow",
            steps: [
                {
                    id: "step-1",
                    title: "Step 1",
                    color: "blue",
                    teams: [{ id: "team-1" }],
                    notifications: [{ id: "notif-1" }]
                }
            ]
        });
    });

    it("should transform CMS entry data correctly", () => {
        const cmsEntry: Pick<CmsEntry<Omit<IWorkflow, "id">>, "id" | "values"> = {
            id: "id-1234",
            values: {
                app: "my-app",
                name: "My Workflow",
                steps: [
                    {
                        id: "step-1",
                        title: "Step 1",
                        color: "blue",
                        teams: [{ id: "team-1" }],
                        notifications: [{ id: "notif-1" }]
                    }
                ]
            }
        };
        const result = transformer.fromCmsEntry(cmsEntry as CmsEntry<IWorkflow>);

        expect(result).toEqual({
            id: "id-1234",
            app: "my-app",
            name: "My Workflow",
            steps: [
                {
                    id: "step-1",
                    title: "Step 1",
                    color: "blue",
                    teams: [{ id: "team-1" }],
                    notifications: [{ id: "notif-1" }]
                }
            ]
        });
    });
});
