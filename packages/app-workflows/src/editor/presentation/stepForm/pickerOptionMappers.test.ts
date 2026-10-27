import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { toFolderPickerOption } from "./toFolderPickerOption.js";
import { toReferencePickerOption } from "./toReferencePickerOption.js";
import { toUserPickerOption } from "./toUserPickerOption.js";

const TEAM_NAMES = new Map([
    ["team-1", "Legal"],
    ["team-2", "Marketing"]
]);

describe("toUserPickerOption (R307)", () => {
    it("is the display name with the person icon and no sub line when no team name is known", () => {
        const user = createWorkflowUserSummary({ id: "user-1", displayName: "Ivan Horvat" });

        expect(toUserPickerOption(user)).toEqual(
            createPickerOption({ id: "user-1", label: "Ivan Horvat", icon: "person" })
        );
    });

    it("lists the known team names of the user, in the user's order, as the sub line", () => {
        const user = createWorkflowUserSummary({
            id: "user-1",
            displayName: "Ivan Horvat",
            teamIds: ["team-2", "team-9", "team-1"]
        });

        const option = toUserPickerOption(user, TEAM_NAMES);

        expect(option.description).toBe("Marketing, Legal");
    });

    it("has no sub line when no team of the user has a known name", () => {
        const user = createWorkflowUserSummary({ teamIds: ["team-9"] });

        expect(toUserPickerOption(user, TEAM_NAMES).description).toBeNull();
    });
});

describe("toFolderPickerOption (R292, R307)", () => {
    it("is the path as the label with the folder icon", () => {
        const folder = createAppFolder({ id: "folder-1", path: "/Campaigns/Spring" });

        expect(toFolderPickerOption(folder)).toEqual(
            createPickerOption({ id: "folder-1", label: "/Campaigns/Spring", icon: "folder" })
        );
    });
});

describe("toReferencePickerOption (R298, D117)", () => {
    it("shows a found user, team and folder by name with the icon of its kind", () => {
        const user = createReferenceLabel({ id: "user-1", label: "Ivan Horvat" });
        const team = createReferenceLabel({ id: "team-1", label: "Marketing" });
        const folder = createReferenceLabel({ id: "folder-1", label: "/Campaigns" });

        expect(toReferencePickerOption(user, "user")).toEqual(
            createPickerOption({ id: "user-1", label: "Ivan Horvat", icon: "person" })
        );
        expect(toReferencePickerOption(team, "team")).toEqual(
            createPickerOption({ id: "team-1", label: "Marketing", icon: "group" })
        );
        expect(toReferencePickerOption(folder, "folder")).toEqual(
            createPickerOption({ id: "folder-1", label: "/Campaigns", icon: "folder" })
        );
    });

    it("shows a deleted user as muted Deleted user with the person_off icon", () => {
        const label = createReferenceLabel({
            id: "user-9",
            label: "Deleted user",
            state: "deleted"
        });

        expect(toReferencePickerOption(label, "user")).toEqual(
            createPickerOption({
                id: "user-9",
                label: "Deleted user",
                muted: true,
                icon: "person_off"
            })
        );
    });

    it("shows a deleted team as muted Deleted team with the group_off icon", () => {
        const label = createReferenceLabel({
            id: "team-9",
            label: "Deleted team",
            state: "deleted"
        });

        expect(toReferencePickerOption(label, "team")).toEqual(
            createPickerOption({
                id: "team-9",
                label: "Deleted team",
                muted: true,
                icon: "group_off"
            })
        );
    });

    it("shows a deleted folder as Deleted folder, not muted and with no icon", () => {
        const label = createReferenceLabel({ id: "f9", label: "Deleted folder", state: "deleted" });

        expect(toReferencePickerOption(label, "folder")).toEqual(
            createPickerOption({ id: "f9", label: "Deleted folder" })
        );
    });

    it("shows a restricted folder as muted, disabled Restricted folder with the lock icon", () => {
        const label = createReferenceLabel({
            id: "f9",
            label: "Restricted folder",
            state: "restricted"
        });

        expect(toReferencePickerOption(label, "folder")).toEqual(
            createPickerOption({
                id: "f9",
                label: "Restricted folder",
                muted: true,
                disabled: true,
                icon: "lock"
            })
        );
    });
});
