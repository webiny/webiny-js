import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createEmptyStepFormOptions } from "./createEmptyStepFormOptions.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { filterPickerOptions } from "./filterPickerOptions.js";
import { getTeamNames } from "./getTeamNames.js";
import { isRestrictedFolder } from "./isRestrictedFolder.js";

describe("getTeamNames (R307)", () => {
    it("unites the team search results, the chosen teams and the found rule teams", () => {
        const teams = {
            ...createEmptyStepFormOptions().teams,
            options: [createPickerOption({ id: "team-1", label: "Legal" })],
            selected: [createPickerOption({ id: "team-2", label: "Marketing" })]
        };
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-3", label: "Press" })]
        });

        const names = getTeamNames(teams, references);

        expect(names.size).toBe(3);
        expect(names.get("team-1")).toBe("Legal");
        expect(names.get("team-2")).toBe("Marketing");
        expect(names.get("team-3")).toBe("Press");
    });

    it("leaves out a deleted rule team and lets the chosen label win over a search result", () => {
        const teams = {
            ...createEmptyStepFormOptions().teams,
            options: [createPickerOption({ id: "team-1", label: "Legal (old)" })],
            selected: [createPickerOption({ id: "team-1", label: "Legal" })]
        };
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-9", label: "Deleted team", state: "deleted" })]
        });

        const names = getTeamNames(teams, references);

        expect(names.get("team-1")).toBe("Legal");
        expect(names.has("team-9")).toBe(false);
    });
});

describe("isRestrictedFolder (R292, QBZ-15)", () => {
    const folders = createFoldersSlice({ items: [createAppFolder({ id: "folder-1" })] });

    it("is true for an id the list does not contain whose reference is restricted", () => {
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })
            ]
        });

        expect(isRestrictedFolder("f9", folders, references)).toBe(true);
    });

    it("is false for a listed folder, whatever the reference says", () => {
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({
                    id: "folder-1",
                    label: "Restricted folder",
                    state: "restricted"
                })
            ]
        });

        expect(isRestrictedFolder("folder-1", folders, references)).toBe(false);
    });

    it("is false for no value, a deleted folder, a found one and an unresolved one", () => {
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({ id: "f8", label: "Deleted folder", state: "deleted" }),
                createReferenceLabel({ id: "f7", label: "/Other" })
            ]
        });

        expect(isRestrictedFolder(null, folders, references)).toBe(false);
        expect(isRestrictedFolder("f8", folders, references)).toBe(false);
        expect(isRestrictedFolder("f7", folders, references)).toBe(false);
        expect(isRestrictedFolder("f6", folders, references)).toBe(false);
    });
});

describe("filterPickerOptions (R292)", () => {
    const options = [
        createPickerOption({ id: "f1", label: "/Campaigns" }),
        createPickerOption({ id: "f2", label: "/Partners" }),
        createPickerOption({ id: "f3", label: "/Campaigns/Spring" })
    ];

    it("returns every option for an empty or blank search", () => {
        expect(filterPickerOptions(options, "")).toEqual(options);
        expect(filterPickerOptions(options, "   ")).toEqual(options);
    });

    it("matches the label case-insensitively and keeps the order", () => {
        expect(filterPickerOptions(options, "CAMP").map(option => option.id)).toEqual(["f1", "f3"]);
        expect(filterPickerOptions(options, " part ").map(option => option.id)).toEqual(["f2"]);
    });

    it("returns nothing when nothing matches", () => {
        expect(filterPickerOptions(options, "zzz")).toEqual([]);
    });
});
