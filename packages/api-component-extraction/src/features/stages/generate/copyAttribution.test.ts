import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { createCopyAttribution } from "./copyAttribution.js";
import { buildComponentPrompt } from "./componentGeneration.js";

// The check run's 2424 Tulane hero, as planned: 7 copies. The representative is a photo carousel
// headed "Your Future Looks Bright / Take in the Sights"; other copies carry an address, a phone
// number and a lead form.
const hero = JSON.parse(
    readFileSync(
        new URL("./__fixtures__/tulane-check-hero-section.plan.json", import.meta.url),
        "utf8"
    )
) as PlannedComponent;

describe("createCopyAttribution", () => {
    const attribute = createCopyAttribution(hero);

    it("attributes the representative's own text to it", () => {
        expect(attribute("Your Future Looks Bright")).toBe("representative");
        expect(attribute("Take in the Sights")).toBe("representative");
    });

    it("attributes another page's address, phone number and form to other copies", () => {
        expect(attribute("2424 Tulane Ave")).toBe("other");
        expect(attribute("866-686-4957")).toBe("other");
        expect(
            attribute(
                "Questions? Concerns? Fill out the form below and someone at 2424 Tulane Apartments will get back to you shortly!"
            )
        ).toBe("other");
    });

    it("leaves text no copy has unattributed", () => {
        expect(attribute("Discover your new home")).toBe("unattributed");
    });

    it("never attributes to another copy when there is only one", () => {
        const single = createCopyAttribution({
            ...hero,
            members: hero.members.filter(
                member =>
                    member.url === hero.representative.url &&
                    member.sectionIndex === hero.representative.sectionIndex
            )
        });
        expect(single("2424 Tulane Ave")).toBe("unattributed");
    });
});

describe("text samples in the Generate prompt", () => {
    const prompt = buildComponentPrompt(hero, new Map());

    it("shows only the section's own values as examples", () => {
        expect(prompt).toContain("- heading (string): e.g. Your Future Looks Bright\n");
        expect(prompt).not.toContain("Apply To Live at 2424 Tulane Apartments");
        expect(prompt).not.toContain("866-686-4957");
        expect(prompt).not.toContain("2424 Tulane Ave");
    });

    it("tells the model to leave a prop empty that only other copies fill", () => {
        expect(prompt).toContain(
            "- phoneNumber (string?) — this section shows no value for it: default it to empty and render nothing when it is empty"
        );
    });
});
