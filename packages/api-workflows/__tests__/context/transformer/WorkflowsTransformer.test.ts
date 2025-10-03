import { describe, expect, it } from "vitest";
import { WorkflowsTransformer } from "~/context/transformer/index.js";
import type { IWorkflow } from "~/types.js";

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
        const cmsEntry: Pick<CmsEntry<IWorkflow>, "id" | "values"> = {
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
        const result = transformer.fromCmsEntry(cmsEntry);

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
