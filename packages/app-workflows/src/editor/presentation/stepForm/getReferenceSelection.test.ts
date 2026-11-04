import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { getReferenceSelection } from "./getReferenceSelection.js";

const IVAN = createPickerOption({ id: "user-1", label: "Ivan Horvat", icon: "person" });

describe("getReferenceSelection (R298, D117)", () => {
    it("is null for no value", () => {
        const selection = getReferenceSelection({
            id: null,
            kind: "user",
            known: [IVAN],
            references: createReferencesSlice()
        });

        expect(selection).toBeNull();
    });

    it("prefers a known option (a pick or a search result) over the resolved reference", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-1", label: "Deleted user", state: "deleted" })]
        });

        const selection = getReferenceSelection({
            id: "user-1",
            kind: "user",
            known: [IVAN],
            references
        });

        expect(selection).toEqual(IVAN);
    });

    it("uses the resolved reference of the kind when nothing known has the id", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-2", label: "Ana Kovač" })],
            teams: [createReferenceLabel({ id: "team-2", label: "Marketing" })],
            folders: [createReferenceLabel({ id: "folder-2", label: "/Partners" })]
        });

        const user = getReferenceSelection({ id: "user-2", kind: "user", known: [], references });
        const team = getReferenceSelection({ id: "team-2", kind: "team", known: [], references });
        const folder = getReferenceSelection({
            id: "folder-2",
            kind: "folder",
            known: [],
            references
        });

        expect(user?.label).toBe("Ana Kovač");
        expect(team?.label).toBe("Marketing");
        expect(folder?.label).toBe("/Partners");
    });

    it("looks only in the map of its kind", () => {
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "x", label: "Marketing" })]
        });

        const selection = getReferenceSelection({ id: "x", kind: "user", known: [], references });

        expect(selection).toBeNull();
    });

    it("shows a deleted reference as its muted label", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
        });

        const selection = getReferenceSelection({
            id: "user-9",
            kind: "user",
            known: [],
            references
        });

        expect(selection).toEqual(
            createPickerOption({
                id: "user-9",
                label: "Deleted user",
                muted: true,
                icon: "person_off"
            })
        );
    });

    it("shows the neutral Searching label for an unresolved id while the resolution runs or after it failed", () => {
        const loading = createReferencesSlice({}, { loading: true });
        const failed = createReferencesSlice({}, { failed: true });

        const whileLoading = getReferenceSelection({
            id: "user-3",
            kind: "user",
            known: [],
            references: loading
        });
        const afterFailure = getReferenceSelection({
            id: "user-3",
            kind: "user",
            known: [],
            references: failed
        });

        const expected = createPickerOption({ id: "user-3", label: "Searching…", muted: true });
        expect(whileLoading).toEqual(expected);
        expect(afterFailure).toEqual(expected);
    });

    it("is null for an unresolved id once the resolution settled (the picker shows Unknown item)", () => {
        const selection = getReferenceSelection({
            id: "user-3",
            kind: "user",
            known: [],
            references: createReferencesSlice()
        });

        expect(selection).toBeNull();
    });
});
