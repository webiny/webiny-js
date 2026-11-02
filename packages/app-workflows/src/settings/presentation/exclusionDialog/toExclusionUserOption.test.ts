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
            icon: "person",
            note: null
        });
    });

    it("disables a user who is already in the list, with the note In the list", () => {
        const option = toExclusionUserOption(ivan, true);

        expect(option.disabled).toBe(true);
        expect(option.note).toBe("In the list");
        expect(option.muted).toBe(false);
    });
});
