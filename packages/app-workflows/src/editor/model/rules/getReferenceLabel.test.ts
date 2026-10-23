import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getReferenceLabel } from "./getReferenceLabel.js";

describe("getReferenceLabel (R298, D117)", () => {
    it("shows the name of a found reference", () => {
        expect(
            getReferenceLabel({ kind: "user", id: "user-1", name: "Ivan Horvat", state: "found" })
        ).toEqual({ id: "user-1", label: "Ivan Horvat", state: "found" });
        expect(
            getReferenceLabel({ kind: "team", id: "team-1", name: "Marketing", state: "found" })
        ).toEqual({ id: "team-1", label: "Marketing", state: "found" });
        expect(
            getReferenceLabel({ kind: "folder", id: "f1", name: "/Campaigns", state: "found" })
        ).toEqual({ id: "f1", label: "/Campaigns", state: "found" });
    });

    it("shows Unknown item for a found reference without a name", () => {
        const label = getReferenceLabel({ kind: "user", id: "user-1", name: null, state: "found" });

        expect(label.label).toBe("Unknown item");
    });

    it("names a deleted user, team and folder", () => {
        const user = getReferenceLabel({ kind: "user", id: "u", name: null, state: "deleted" });
        const team = getReferenceLabel({ kind: "team", id: "t", name: null, state: "deleted" });
        const folder = getReferenceLabel({ kind: "folder", id: "f", name: null, state: "deleted" });

        expect(user).toEqual({ id: "u", label: "Deleted user", state: "deleted" });
        expect(team).toEqual({ id: "t", label: "Deleted team", state: "deleted" });
        expect(folder).toEqual({ id: "f", label: "Deleted folder", state: "deleted" });
    });

    it("names a restricted folder and ignores any name it was given", () => {
        const label = getReferenceLabel({
            kind: "folder",
            id: "f9",
            name: "/Partners",
            state: "restricted"
        });

        expect(label).toEqual({ id: "f9", label: "Restricted folder", state: "restricted" });
    });
});
