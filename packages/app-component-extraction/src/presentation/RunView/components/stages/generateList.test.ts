import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { GeneratedComponentDto } from "~/shared/types.js";
import {
    failureBanners,
    filterCounts,
    regenerateInstruction,
    visibleComponents
} from "./generateList.js";

/* FreehillStreetLofts Fixes Check 3's Generate output as the API returned it on 2026-10-13: eight
 * components, three of which failed text preservation after three attempts. */
const fixture = JSON.parse(
    readFileSync(
        join(__dirname, "__fixtures__", "generate-freehill-fixes-3-2026-10-13.json"),
        "utf8"
    )
) as { components: GeneratedComponentDto[] };
const components = fixture.components;
const named = (name: string) => components.find(component => component.name === name)!;

describe("the Generate list", () => {
    it("puts the components that need attention first, then the most-used", () => {
        const names = visibleComponents(components, {}, "all").map(component => component.name);
        expect(names.slice(0, 3).sort()).toEqual(
            ["Amenities List", "Contact Form", "Privacy Policy"].sort()
        );
        // After them, by page count: the three two-page components lead the passing ones.
        expect(names.slice(3, 6).sort()).toEqual(
            ["Contact Info", "Footer with address and office hours", "Site Header"].sort()
        );
    });

    it("counts each filter from the decisions, and filters by them", () => {
        const decisions = {
            [named("Contact Info").signature]: "accepted",
            [named("Hero Banner").signature]: "accepted",
            [named("Privacy Policy").signature]: "rejected"
        };
        expect(filterCounts(components, decisions)).toEqual({
            all: 8,
            attention: 3,
            undecided: 5,
            accepted: 2,
            rejected: 1
        });
        expect(visibleComponents(components, decisions, "rejected").map(c => c.name)).toEqual([
            "Privacy Policy"
        ]);
        expect(visibleComponents(components, decisions, "attention")).toHaveLength(3);
    });

    it("states a failed check with its attempts and what the check found", () => {
        expect(failureBanners(named("Contact Form"))).toEqual([
            {
                title: "Text not preserved after 3 attempts.",
                detail: 'missing text: "Phone Number"'
            }
        ]);
        expect(failureBanners(named("Privacy Policy"))[0]!.detail).toBe(
            'missing text: "Users may learn more about Google Analyt"; missing text: "The Site may provide links to other Web "'
        );
        expect(failureBanners(named("Hero Banner"))).toEqual([]);
    });

    it("sends the issues picked and the note to the model, and nothing when both are empty", () => {
        expect(
            regenerateInstruction(["Wrong height", "Missing image"], " Keep the dark background ")
        ).toBe("What's off: Wrong height, Missing image.\nKeep the dark background");
        expect(regenerateInstruction([], "Three columns")).toBe("Three columns");
        expect(regenerateInstruction([], "  ")).toBe("");
    });
});
