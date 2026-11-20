import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { toExclusionUserOption } from "~/settings/presentation/exclusionDialog/toExclusionUserOption.js";

describe("toExclusionUserOption (R324, Q64)", () => {
    const ivan = createWorkflowUserSummary({ id: "user-ivan", displayName: "Ivan Horvat" });

    it("lists a user who is not in the list as a pickable person", () => {
        expect(toExclusionUserOption(ivan, false)).toEqual({
            id: "user-ivan",
            label: "Ivan Horvat",
            description: null,
            warning: null,
            muted: false,
            disabled: false,
            icon: null,
            note: null
        });
    });

    it("describes a user with the names of the teams, joined with commas", () => {
        const member = createWorkflowUserSummary({
            id: "user-ivan",
            displayName: "Ivan Horvat",
            teams: [
                { id: "team-1", name: "Editors" },
                { id: "team-2", name: "Legal" }
            ]
        });

        expect(toExclusionUserOption(member, false).description).toBe("Editors, Legal");
    });

    it("disables a user who is already in the list, with the note Already excluded", () => {
        const option = toExclusionUserOption(ivan, true);

        expect(option.disabled).toBe(true);
        expect(option.note).toBe("Already excluded");
        expect(option.muted).toBe(false);
    });
});
