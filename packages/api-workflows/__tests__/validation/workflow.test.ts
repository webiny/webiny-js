import { describe, expect, it } from "vitest";
import { workflowValidation } from "~/validation/workflow";

describe("workflow validation", () => {
    it("should validate a simple workflow", async () => {
        const result = await workflowValidation.safeParseAsync({
            id: "workflow1",
            name: "My Workflow",
            steps: [
                {
                    id: "step1",
                    title: "Step 1",
                    color: "#FF0000",
                    description: "This is step 1",
                    teams: [{ id: "team1" }],
                    notifications: [{ id: "notification1" }]
                }
            ]
        });
        expect(result.success).toBeTrue();
    });

    it("should fail validation if 'name' is missing", async () => {
        const result = await workflowValidation.safeParseAsync({
            id: "workflow1",
            steps: [
                {
                    id: "step1",
                    title: "Step 1",
                    color: "#FF0000",
                    description: "This is step 1",
                    teams: [{ id: "team1" }],
                    notifications: [{ id: "notification1" }]
                }
            ]
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("Required");
    });

    it("should fail validation if 'steps' is empty", async () => {
        const result = await workflowValidation.safeParseAsync({
            id: "workflow1",
            name: "My Workflow",
            steps: []
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("You must add at least one step.");
    });
});
