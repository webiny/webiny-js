import { describe, expect, it } from "vitest";
import { alignRunsByRole, runRole } from "./alignRunsByRole.js";
import type { SectionRun } from "./collectSectionTexts.js";

const run = (tag: string, text = ""): SectionRun => ({ tag, text });

describe("runRole", () => {
    it("treats every heading level as one role", () => {
        expect(["h1", "h2", "h3", "h4", "h5", "h6"].map(runRole)).toEqual(
            new Array(6).fill("heading")
        );
    });

    it("keeps roles that mean different things apart", () => {
        expect(runRole("label")).toBe("label");
        expect(runRole("a")).toBe("a");
        expect(runRole("button")).toBe("button");
        expect(runRole("li")).toBe("li");
        expect(runRole("h2")).not.toBe(runRole("p"));
    });
});

describe("alignRunsByRole", () => {
    it("maps each run to itself when the two sections have the same shape", () => {
        const shape = [run("h2"), run("p"), run("a")];
        expect(alignRunsByRole(shape, shape)).toEqual([0, 1, 2]);
    });

    it("absorbs runs inserted ahead of the ones that match", () => {
        // The measured case: two buttons before a form shift every index by two.
        const representative = [run("label"), run("label"), run("span")];
        const instance = [run("span"), run("span"), run("label"), run("label"), run("span")];

        expect(alignRunsByRole(representative, instance)).toEqual([2, 3, 4]);
    });

    it("reports no counterpart for a role the instance does not have", () => {
        const representative = [run("h2"), run("label")];
        const instance = [run("label")];

        expect(alignRunsByRole(representative, instance)).toEqual([-1, 0]);
    });

    it("aligns a heading across levels", () => {
        expect(alignRunsByRole([run("h1"), run("p")], [run("h2"), run("p")])).toEqual([0, 1]);
    });

    it("returns an empty mapping for an empty representative", () => {
        expect(alignRunsByRole([], [run("p")])).toEqual([]);
    });

    it("gives every run no counterpart when the instance has no runs", () => {
        expect(alignRunsByRole([run("h2"), run("p")], [])).toEqual([-1, -1]);
    });
});
