import { describe, expect, it } from "vitest";
import type { SummaryValueEntry } from "~/api/core/types.js";
import { renderSummary } from "~/api/cms/summary/renderSummary.js";
import { DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "~/api/cms/summary/config.js";

/**
 * The mechanical summary, which most saves get.
 *
 * It is the half of this feature that runs without a model, without a job and without a network,
 * and it is therefore the half that has to be exactly right: whatever it says is stored verbatim
 * and kept for as long as the record is.
 */

const options = DEFAULT_ACTIVITY_SUMMARY_CONFIG;

const entry = (
    label: string,
    before: unknown,
    after: unknown,
    path = label.toLowerCase()
): SummaryValueEntry => ({ path, label, before, after }) as SummaryValueEntry;

const render = (...values: SummaryValueEntry[]) => renderSummary(values, options);

describe("quoting short values", () => {
    it("says what a field was and what it became", () => {
        // The whole reason this is worth having. "Edited Tier" costs a reader a trip to version
        // compare; this does not.
        //
        // Quoted because a value's boundary is otherwise a guess: "from Now I like the new
        // description to Now I like the new description, it is really great" contains a " to "
        // that is not the separator, and nothing in the sentence says so.
        expect(render(entry("Tier", "Starter", "Essential"))).toBe(
            "Changed Tier from “Starter” to “Essential”."
        );
    });

    it("reads a boolean as an editor would say it", () => {
        expect(render(entry("On sale", true, false))).toBe("Changed On sale from Yes to No.");
    });

    it("quotes a number", () => {
        expect(render(entry("Price", 19, 24))).toBe("Changed Price from 19 to 24.");
    });

    it("flattens a value that spans lines, so it does not break the row", () => {
        expect(render(entry("Strapline", "one\n  two", "three\nfour"))).toBe(
            "Changed Strapline from “one two” to “three four”."
        );
    });

    it("names a nested field the way the rest of the feature does", () => {
        // Same derivation as the prompt and the expanded row. A field named three different ways
        // on one screen is the thing the shared package exists to prevent.
        expect(render(entry("Heading", "Old", "New", "hero.heading"))).toBe(
            "Changed Hero › Heading from “Old” to “New”."
        );
    });
});

describe("values too long to quote", () => {
    const long = (marker: string, length: number) => `${marker} `.repeat(length);

    it("characterises rather than reproducing", () => {
        // A timeline row holding a paragraph is a timeline nobody reads, and retention makes it
        // permanent. The same instruction the model is given, applied mechanically.
        const summary = render(entry("Body", long("old", 40), long("new", 40)));

        expect(summary).toBe("Rewrote Body.");
        expect(summary).not.toContain("old");
    });

    it("says a value grew", () => {
        expect(render(entry("Body", long("short", 20), long("longer", 60)))).toBe("Expanded Body.");
    });

    it("says a value shrank", () => {
        expect(render(entry("Body", long("long", 60), long("cut", 20)))).toBe("Shortened Body.");
    });

    it("quotes at the threshold and characterises one character past it", () => {
        const at = "x".repeat(options.quotedValueMaxLength);
        const over = "x".repeat(options.quotedValueMaxLength + 1);

        expect(render(entry("Note", "y", at))).toContain(at);
        expect(render(entry("Note", "y", over))).not.toContain(over);
    });

    it("never quotes an object, however small", () => {
        // `{"_id":"a1b2","heading":"…"}` in the middle of a sentence is worse than saying nothing.
        const summary = render(entry("Link", { url: "a" }, { url: "b" }));

        expect(summary).not.toContain("url");
        expect(summary).toContain("Link");
    });
});

describe("appearing and disappearing", () => {
    it("says a field was filled in, with its value when it is short", () => {
        expect(render(entry("Subtitle", "", "A new subtitle"))).toBe(
            "Set Subtitle to “A new subtitle”."
        );
    });

    it("says a field was filled in without quoting a long one", () => {
        expect(render(entry("Body", "", "x".repeat(500)))).toBe("Filled in Body.");
    });

    it("says a field was cleared", () => {
        expect(render(entry("Subtitle", "Was here", ""))).toBe("Cleared Subtitle.");
    });

    it("treats an absent value as absent, not as the string undefined", () => {
        expect(render(entry("Subtitle", undefined, "Now set"))).toBe("Set Subtitle to “Now set”.");
        expect(render(entry("Subtitle", "Was set", undefined))).toBe("Cleared Subtitle.");
    });
});

describe("several fields at once", () => {
    it("says a repeated verb once", () => {
        // "Changed Name from Widget to Gadget and changed On sale from Yes to No" reads like a
        // machine wrote it, which — while true — is not a reason to sound like one.
        expect(render(entry("Name", "Widget", "Gadget"), entry("On sale", true, false))).toBe(
            "Changed Name from “Widget” to “Gadget” and On sale from Yes to No."
        );
    });

    it("keeps distinct verbs", () => {
        expect(render(entry("Name", "Widget", "Gadget"), entry("Body", "", "x".repeat(500)))).toBe(
            "Changed Name from “Widget” to “Gadget” and filled in Body."
        );
    });

    it("counts the fields it does not name", () => {
        // The same instruction the model is given: describe the largest changes and say that other
        // fields also changed. A sentence naming thirty fields is the list it replaced.
        const many = Array.from({ length: 6 }, (_, i) => entry(`Field ${i}`, `a${i}`, `b${i}`));

        expect(render(...many)).toBe(
            "Changed Field 0 from “a0” to “b0”, Field 1 from “a1” to “b1”, " +
                "Field 2 from “a2” to “b2” and touched 3 other fields."
        );
    });

    it("names the count in the singular when only one is left over", () => {
        const four = Array.from({ length: 4 }, (_, i) => entry(`Field ${i}`, `a${i}`, `b${i}`));

        expect(render(...four)).toContain("touched 1 other field.");
    });

    it("does not let the count merge into the run above it", () => {
        // With a shared verb the count would read as another named field: "…, Field 2 from a2 to
        // b2 and 3 other fields" says nothing about what happened to those three.
        const many = Array.from({ length: 6 }, (_, i) => entry(`Field ${i}`, `a${i}`, `b${i}`));

        expect(render(...many)).not.toMatch(/and 3 other fields/);
    });
});

describe("nothing to say", () => {
    it("returns nothing at all when no value actually moved", () => {
        // The differ should not produce this. If it does, an empty string is better than a
        // sentence asserting a change that did not happen.
        expect(render(entry("Title", "Same", "Same"))).toBe("");
    });

    it("returns nothing for an empty bundle", () => {
        expect(render()).toBe("");
    });
});

describe("where a value ends", () => {
    it("marks the boundary of a value that reads like a sentence", () => {
        // The case that made this necessary. Without the marks the reader has to guess which " to "
        // separates the two values, and the obvious guess is wrong.
        const before = "Now I like the new description";
        const after = "Now I like the new description, it is really great.";

        expect(render(entry("Description", before, after))).toBe(
            `Changed Description from “${before}” to “${after}”.`
        );
    });

    it("leaves a value that holds no doubt unquoted", () => {
        // A boundary is worth marking where one is in doubt. "Yes" and "1199" hold none, and
        // quoting them would spend the mark on the case that never needed it.
        expect(render(entry("On sale", true, false))).toBe("Changed On sale from Yes to No.");
        expect(render(entry("Price", 19, 24))).toBe("Changed Price from 19 to 24.");
    });

    it("straightens a delimiter inside a value rather than dropping it", () => {
        // A value carrying the mark would make its own boundary ambiguous. The reader still sees a
        // quotation and the sentence still parses.
        const summary = render(entry("Title", "plain", "the “best” one"));

        expect(summary).toBe('Changed Title from “plain” to “the "best" one”.');
    });
});
