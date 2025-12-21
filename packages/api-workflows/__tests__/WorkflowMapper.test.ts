import { describe, expect, it } from "vitest";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";
import { WorkflowMapper } from "~/domain/workflow/WorkflowMapper.js";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";

describe("Workflows Mapper", () => {
    const mapper = new WorkflowMapper();

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
                    teams: [{ id: FULL_ACCESS_TEAM_ID }],
                    notifications: [{ id: "notif-1" }]
                }
            ]
        };

        const result = mapper.toCmsEntry(workflow);

        expect(result).toEqual({
            id: "id-1234",
            app: "my-app",
            name: "My Workflow",
            steps: [
                {
                    id: "step-1",
                    title: "Step 1",
                    color: "blue",
                    teams: [{ id: FULL_ACCESS_TEAM_ID }],
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
                        teams: [{ id: FULL_ACCESS_TEAM_ID }],
                        notifications: [{ id: "notif-1" }]
                    }
                ]
            }
        };
        const result = mapper.fromCmsEntry(cmsEntry as CmsEntry<IWorkflow>);

        expect(result).toEqual({
            id: "id-1234",
            app: "my-app",
            name: "My Workflow",
            steps: [
                {
                    id: "step-1",
                    title: "Step 1",
                    color: "blue",
                    teams: [{ id: FULL_ACCESS_TEAM_ID }],
                    notifications: [{ id: "notif-1" }]
                }
            ]
        });
    });
});
