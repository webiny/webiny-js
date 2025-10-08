import { describe, expect, it } from "vitest";
import { stepValidation } from "~/validation/step.js";

describe("step validation", () => {
    it("should validate a workflow step with all required fields", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.success).toBeTrue();
    });

    it("should fail validation if 'id' is missing", async () => {
        const result = await stepValidation.safeParseAsync({
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("Required");
    });

    it("should fail validation if 'title' is missing", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("Required");
    });

    it("should fail validation if 'color' is missing", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            title: "Step 1",
            description: "This is step 1",
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("Required");
    });

    it("should fail validation if 'teams' is empty", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [],
            notifications: [{ id: "notification1" }]
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("You must select at least one team.");
    });

    it("should pass validation if 'description' is missing", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.success).toBeTrue();
    });

    it("should pass validation if 'notifications' is missing", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }]
        });
        expect(result.success).toBeTrue();
    });

    it("should transform 'description' from null to undefined", async () => {
        const result = await stepValidation.parseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: null,
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.description).toBeUndefined();
    });

    it("should transform 'teams' to NonEmptyArray", async () => {
        const result = await stepValidation.parseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.teams.length).toBe(1);
        expect(result.teams[0].id).toBe("team1");
    });

    it("should transform 'notifications' to array if provided", async () => {
        const result = await stepValidation.parseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.notifications!.length).toBe(1);
        expect(result.notifications![0].id).toBe("notification1");
    });

    it("should handle multiple teams and notifications", async () => {
        const result = await stepValidation.parseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }, { id: "team2" }],
            notifications: [{ id: "notification1" }, { id: "notification2" }]
        });
        expect(result.teams.length).toBe(2);
        expect(result.notifications!.length).toBe(2);
    });

    it("should fail validation if 'teams' contains an invalid entry", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "" }],
            notifications: [{ id: "notification1" }]
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("Team ID is required.");
    });

    it("should fail validation if 'notifications' contains an invalid entry", async () => {
        const result = await stepValidation.safeParseAsync({
            id: "step1",
            title: "Step 1",
            color: "#FF0000",
            description: "This is step 1",
            teams: [{ id: "team1" }],
            notifications: [{ id: "" }]
        });
        expect(result.success).toBeFalse();
        expect(result.error!.errors[0].message).toBe("Notification ID is required.");
    });
});
