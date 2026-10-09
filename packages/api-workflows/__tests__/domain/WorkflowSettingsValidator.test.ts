import { describe, expect, it } from "vitest";
import { WorkflowSettingsValidator } from "~/domain/settings/WorkflowSettingsValidator.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";

describe("WorkflowSettingsValidator", () => {
    it("normalizes end dates to UTC, trims reasons and drops empty optionals", () => {
        const result = WorkflowSettingsValidator.validate({
            exclusions: [
                { userId: "user-a", reason: " On leave ", endsOn: "2026-10-09T23:59:59+02:00" },
                { userId: "user-b", reason: "   " }
            ]
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: "2026-10-09T21:59:59.000Z" },
                { userId: "user-b" }
            ]
        });
    });

    it("rejects a second entry for the same user", () => {
        const result = WorkflowSettingsValidator.validate({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", reason: "Again" }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect(result.error.message).toBe("This user is already in the list. Edit it instead.");
        expect(result.error.data).toEqual({ userId: "user-a" });
    });

    it("rejects an entry without a user or with an invalid end date", () => {
        const noUser = WorkflowSettingsValidator.validate({ exclusions: [{ userId: " " }] });
        const badDate = WorkflowSettingsValidator.validate({
            exclusions: [{ userId: "user-a", endsOn: "next week" }]
        });

        expect(noUser.error.message).toBe("Every exclusion needs a user.");
        expect(badDate.error.message).toBe('The end date "next week" is not a valid date.');
    });
});

describe("filterActiveExclusions", () => {
    it("keeps entries without an end date and entries that end later", () => {
        const now = new Date("2026-10-09T10:00:00.000Z");

        const active = filterActiveExclusions(
            [
                { userId: "user-a" },
                { userId: "user-b", endsOn: "2026-10-09T09:59:59.000Z" },
                { userId: "user-c", endsOn: "2026-10-09T10:00:00.001Z" }
            ],
            now
        );

        expect(active.map(exclusion => exclusion.userId)).toEqual(["user-a", "user-c"]);
    });
});
