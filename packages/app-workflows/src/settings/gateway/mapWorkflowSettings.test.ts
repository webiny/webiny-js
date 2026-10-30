import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowExclusionDto } from "./dto.js";
import type { WorkflowSettingsDto } from "./dto.js";
import { mapWorkflowSettings } from "./mapWorkflowSettings.js";

describe("mapWorkflowSettings (R317)", () => {
    it("maps every exclusion with its user id, reason and end date", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        };

        expect(mapWorkflowSettings(dto)).toEqual({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        });
    });

    it("keeps a null reason and a null end date as null", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const result = mapWorkflowSettings(dto);

        expect(result.exclusions[0]).toEqual({ userId: "user-1", reason: null, endsOn: null });
    });

    it("maps an absent reason and an absent end date to null", () => {
        const exclusion: WorkflowExclusionDto = { userId: "user-1", reason: null, endsOn: null };
        Reflect.deleteProperty(exclusion, "reason");
        Reflect.deleteProperty(exclusion, "endsOn");
        const dto: WorkflowSettingsDto = { exclusions: [exclusion] };

        const result = mapWorkflowSettings(dto);

        expect(result.exclusions[0].reason).toBeNull();
        expect(result.exclusions[0].endsOn).toBeNull();
    });

    it("keeps the order the server returned, expired entries included", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-c", reason: null, endsOn: "2020-01-01T00:00:00.000Z" },
                { userId: "user-a", reason: null, endsOn: null },
                { userId: "user-b", reason: "Busy", endsOn: null }
            ]
        };

        const ids = mapWorkflowSettings(dto).exclusions.map(exclusion => exclusion.userId);

        expect(ids).toEqual(["user-c", "user-a", "user-b"]);
    });

    it("maps an empty list to an empty list", () => {
        const dto: WorkflowSettingsDto = { exclusions: [] };

        expect(mapWorkflowSettings(dto)).toEqual({ exclusions: [] });
    });

    it("does not share the list or the entries of the DTO", () => {
        const dto: WorkflowSettingsDto = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const result = mapWorkflowSettings(dto);

        expect(result.exclusions).not.toBe(dto.exclusions);
        expect(result.exclusions[0]).not.toBe(dto.exclusions[0]);
    });
});
