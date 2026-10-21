import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { toWorkflowSettingsDto } from "./toWorkflowSettingsDto.js";

describe("toWorkflowSettingsDto (R317)", () => {
    it("writes every exclusion with its user id, reason and end date", () => {
        const settings: WorkflowSettings = {
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        };

        expect(toWorkflowSettingsDto(settings)).toEqual({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" }
            ]
        });
    });

    it("sends a null reason and a null end date as null, not as an absent key", () => {
        const settings: WorkflowSettings = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const entry = toWorkflowSettingsDto(settings).exclusions[0];

        expect(Object.keys(entry)).toEqual(["userId", "reason", "endsOn"]);
        expect(entry.reason).toBeNull();
        expect(entry.endsOn).toBeNull();
    });

    it("keeps the order of the list", () => {
        const settings: WorkflowSettings = {
            exclusions: [
                { userId: "user-b", reason: null, endsOn: null },
                { userId: "user-a", reason: null, endsOn: null }
            ]
        };

        const ids = toWorkflowSettingsDto(settings).exclusions.map(entry => entry.userId);

        expect(ids).toEqual(["user-b", "user-a"]);
    });

    it("writes an empty list as an empty list", () => {
        const settings: WorkflowSettings = { exclusions: [] };

        expect(toWorkflowSettingsDto(settings)).toEqual({ exclusions: [] });
    });

    it("does not share the list or the entries of the settings", () => {
        const settings: WorkflowSettings = {
            exclusions: [{ userId: "user-1", reason: null, endsOn: null }]
        };

        const dto = toWorkflowSettingsDto(settings);

        expect(dto.exclusions).not.toBe(settings.exclusions);
        expect(dto.exclusions[0]).not.toBe(settings.exclusions[0]);
    });
});
