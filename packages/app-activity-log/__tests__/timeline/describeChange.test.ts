import { describe, expect, it } from "vitest";
import { describeChange, humaniseFieldId } from "~/timeline/describeChange.js";

describe("humaniseFieldId", () => {
    it("splits camel case", () => {
        expect(humaniseFieldId("heroHeadline")).toBe("Hero headline");
    });

    it("handles a single word", () => {
        expect(humaniseFieldId("title")).toBe("Title");
    });

    it("handles snake and kebab case", () => {
        expect(humaniseFieldId("hero_headline")).toBe("Hero headline");
        expect(humaniseFieldId("hero-headline")).toBe("Hero headline");
    });

    it("leaves an empty id alone rather than returning an empty string", () => {
        expect(humaniseFieldId("")).toBe("");
    });
});

describe("describeChange", () => {
    it("uses the captured label for a top-level field and has no ancestors", () => {
        const described = describeChange({ path: "title", label: "Headline" });

        expect(described).toMatchObject({ label: "Headline", ancestors: [], text: "Headline" });
    });

    it("names the containing fields for a nested path", () => {
        const described = describeChange({ path: "author.address.city", label: "City" });

        expect(described.ancestors).toEqual(["Author", "Address"]);
        expect(described.text).toBe("Author › Address › City");
    });

    it("reads a deep path through an identified block", () => {
        // The raw path is `sections#a1b2c3d4e5f6.blocks[2].title`, which is precise and unreadable.
        const described = describeChange({
            path: "sections#a1b2c3d4e5f6.blocks[2].title",
            label: "Title"
        });

        expect(described.ancestors).toEqual(["Sections", "Blocks"]);
        expect(described.position).toBe(3);
        expect(described.text).toBe("Sections › Blocks › Title");
    });

    it("reports a one-based position, because readers do not count from zero", () => {
        const described = describeChange({ path: "tags[0]", label: "Tags" });

        expect(described.position).toBe(1);
    });

    it("gives no position for an id-keyed block", () => {
        // A stable id says which block changed, not where it sits — and it may have moved since.
        const described = describeChange({
            path: "sections#a1b2c3d4e5f6",
            label: "Sections",
            operation: "added"
        });

        expect(described.position).toBeUndefined();
        expect(described.operation).toBe("added");
    });

    it("keeps the container as an ancestor when the path ends at a list item", () => {
        const described = describeChange({
            path: "sections#a1b2c3d4e5f6",
            label: "Sections",
            operation: "removed"
        });

        expect(described.ancestors).toEqual(["Sections"]);
    });

    it("keeps the container when the path ends at a positional item", () => {
        const described = describeChange({ path: "sections[1]", label: "Sections" });

        expect(described.ancestors).toEqual(["Sections"]);
        expect(described.position).toBe(2);
    });

    it("surfaces the innermost position when a path has several", () => {
        const described = describeChange({ path: "a[1].b[4].c", label: "C" });

        expect(described.position).toBe(5);
    });

    it("falls back to the field id when the captured label is empty", () => {
        // Better than rendering a blank row.
        const described = describeChange({ path: "author.heroHeadline", label: "" });

        expect(described.label).toBe("Hero headline");
    });

    it("describes the rolled-up entry as the parent it points at", () => {
        // Past the cap, the changeset collapses to a common parent with no leaf of its own.
        const described = describeChange({ path: "author", label: "Author" });

        expect(described).toMatchObject({ label: "Author", ancestors: [], text: "Author" });
    });

    it("describes the target root, which is what a full roll-up collapses to", () => {
        const described = describeChange({ path: "", label: "" });

        expect(described.ancestors).toEqual([]);
        expect(described.text).toBe("");
    });
});
