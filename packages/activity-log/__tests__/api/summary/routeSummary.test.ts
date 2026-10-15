import { describe, expect, it } from "vitest";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { ChangesetEntry } from "~/api/core/types.js";
import { routeSummary } from "~/api/cms/summary/routeSummary.js";
import { DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "~/api/cms/summary/config.js";

/**
 * The routing rule, which decides how often a model is called and therefore what the feature costs.
 *
 * Every branch is covered, and each cap is tested at its boundary rather than somewhere safely past
 * it — an off-by-one here is invisible in review and shows up as a bill.
 */

const field = (overrides: Partial<CmsModelField> & { fieldId: string }): CmsModelField =>
    ({
        id: overrides.fieldId,
        type: "text",
        storageId: `text@${overrides.fieldId}`,
        label: overrides.fieldId,
        validation: [],
        listValidation: [],
        ...overrides
    }) as CmsModelField;

const model = (fields: CmsModelField[]): CmsModel =>
    ({ modelId: "page", fields }) as unknown as CmsModel;

const change = (path: string, operation?: ChangesetEntry["operation"]): ChangesetEntry => ({
    path,
    label: path,
    ...(operation ? { operation } : {})
});

/** Long enough to count as prose under the default threshold of 200. */
const prose = (marker: string) => `${marker} `.repeat(60);

const route = (overrides: Partial<Parameters<typeof routeSummary>[0]> = {}) =>
    routeSummary({
        model: model([field({ fieldId: "intro" }), field({ fieldId: "body" })]),
        changeset: [change("intro"), change("body")],
        before: { intro: prose("old intro"), body: prose("old body") },
        after: { intro: prose("new intro"), body: prose("new body") },
        source: "admin",
        aiAvailable: true,
        config: DEFAULT_ACTIVITY_SUMMARY_CONFIG,
        ...overrides
    });

describe("the happy path", () => {
    it("dispatches when two prose fields changed", () => {
        const decision = route();

        expect(decision.kind).toBe("ai");
        expect(decision.kind === "ai" && decision.values).toHaveLength(2);
    });

    it("carries before and after for every changed path", () => {
        const decision = route();

        expect(decision.kind === "ai" && decision.values[0]).toMatchObject({
            path: "intro",
            label: "intro"
        });
        expect(decision.kind === "ai" && decision.values[0]!.before).toContain("old intro");
        expect(decision.kind === "ai" && decision.values[0]!.after).toContain("new intro");
    });
});

describe("who wrote it", () => {
    it("skips an API key", () => {
        // Machine traffic is where the volume is, and it is the one origin that can be told apart.
        expect(route({ source: "api-key" })).toMatchObject({
            kind: "none",
            reason: "not-interactive"
        });
    });

    it("skips anything a background task performed", () => {
        // Covers bulk operations, which run as tasks and carry a `task:` source.
        expect(route({ source: "task:hcmsBulkProcessEntries" })).toMatchObject({
            kind: "none",
            reason: "not-interactive"
        });
    });

    it("skips a system write", () => {
        expect(route({ source: "system" })).toMatchObject({
            kind: "none",
            reason: "not-interactive"
        });
    });

    it("does not skip a script using a person's token, because it cannot tell", () => {
        // Stated as a test rather than left implicit: this is the gap the identity rule does not
        // close, and it should fail loudly if someone later believes it does.
        expect(route({ source: "admin" }).kind).toBe("ai");
    });
});

describe("what changed", () => {
    it("skips when there is no before state at all", () => {
        expect(route({ before: undefined })).toMatchObject({
            kind: "none",
            reason: "structural-only"
        });
    });

    it("skips an empty changeset", () => {
        expect(route({ changeset: [] })).toMatchObject({
            kind: "none",
            reason: "structural-only"
        });
    });

    it("skips when every change is structural", () => {
        expect(
            route({
                changeset: [change("blocks#a1", "added"), change("blocks#b2", "moved")]
            })
        ).toMatchObject({ kind: "none", reason: "structural-only" });
    });

    it("still routes when a structural change sits alongside prose", () => {
        const decision = route({
            changeset: [change("intro"), change("body"), change("blocks#a1", "added")]
        });

        expect(decision.kind).toBe("ai");
    });
});

describe("the path cap, at its boundary", () => {
    const manyPaths = (count: number) => Array.from({ length: count }, (_, i) => change(`f${i}`));

    const wideModel = (count: number) =>
        model(Array.from({ length: count }, (_, i) => field({ fieldId: `f${i}` })));

    const wideValues = (count: number, marker: string) =>
        Object.fromEntries(Array.from({ length: count }, (_, i) => [`f${i}`, prose(marker)]));

    it("routes at exactly the cap", () => {
        const cap = DEFAULT_ACTIVITY_SUMMARY_CONFIG.maxPaths;

        expect(
            route({
                model: wideModel(cap),
                changeset: manyPaths(cap),
                before: wideValues(cap, "old"),
                after: wideValues(cap, "new")
            }).kind
        ).toBe("ai");
    });

    it("skips one past the cap", () => {
        const over = DEFAULT_ACTIVITY_SUMMARY_CONFIG.maxPaths + 1;

        expect(
            route({
                model: wideModel(over),
                changeset: manyPaths(over),
                before: wideValues(over, "old"),
                after: wideValues(over, "new")
            })
        ).toMatchObject({ kind: "deterministic", reason: "too-many-paths" });
    });
});

describe("free-text classification", () => {
    it("counts long-text whatever its length", () => {
        const decision = route({
            model: model([
                field({ fieldId: "a", type: "long-text" }),
                field({ fieldId: "b", type: "long-text" })
            ]),
            changeset: [change("a"), change("b")],
            before: { a: "x", b: "y" },
            after: { a: "p", b: "q" }
        });

        expect(decision.kind).toBe("ai");
    });

    it("counts rich-text whatever its length", () => {
        const decision = route({
            model: model([
                field({ fieldId: "a", type: "rich-text" }),
                field({ fieldId: "b", type: "rich-text" })
            ]),
            changeset: [change("a"), change("b")],
            before: { a: { t: "x" }, b: { t: "y" } },
            after: { a: { t: "p" }, b: { t: "q" } }
        });

        expect(decision.kind).toBe("ai");
    });

    it("skips short text fields, which are the common save", () => {
        // A title and a slug changing. The deterministic description already reads perfectly.
        expect(
            route({
                before: { intro: "Spring launch", body: "/campaigns/aurora" },
                after: { intro: "Summer launch", body: "/campaigns/solstice" }
            })
        ).toMatchObject({ kind: "deterministic", reason: "too-few-text-fields" });
    });

    it("counts a text field at exactly the threshold", () => {
        const at = "x".repeat(DEFAULT_ACTIVITY_SUMMARY_CONFIG.freeTextMinLength);

        expect(
            route({ before: { intro: at, body: at }, after: { intro: "a", body: "b" } }).kind
        ).toBe("ai");
    });

    it("skips a text field one character below the threshold", () => {
        const below = "x".repeat(DEFAULT_ACTIVITY_SUMMARY_CONFIG.freeTextMinLength - 1);

        expect(
            route({ before: { intro: below, body: below }, after: { intro: "a", body: "b" } })
        ).toMatchObject({ kind: "deterministic", reason: "too-few-text-fields" });
    });

    it("measures the longer side, so deleting a paragraph counts", () => {
        // The after is empty. Without the max() this would read as a short change.
        expect(
            route({
                before: { intro: prose("gone"), body: prose("also") },
                after: { intro: "", body: "" }
            }).kind
        ).toBe("ai");
    });

    it("never counts a text field with predefined values", () => {
        // An enum wearing a text type. Its value can be long without being prose.
        const enumField = (fieldId: string) =>
            field({
                fieldId,
                predefinedValues: { enabled: true, values: [] }
            } as Partial<CmsModelField> & { fieldId: string });

        expect(
            route({
                model: model([enumField("intro"), enumField("body")]),
                before: { intro: prose("a"), body: prose("b") },
                after: { intro: prose("c"), body: prose("d") }
            })
        ).toMatchObject({ kind: "deterministic", reason: "too-few-text-fields" });
    });

    it("never counts json, however large", () => {
        expect(
            route({
                model: model([
                    field({ fieldId: "a", type: "json" }),
                    field({ fieldId: "b", type: "searchable-json" })
                ]),
                changeset: [change("a"), change("b")],
                before: { a: { v: prose("x") }, b: { v: prose("y") } },
                after: { a: { v: prose("p") }, b: { v: prose("q") } }
            })
        ).toMatchObject({ kind: "deterministic", reason: "too-few-text-fields" });
    });

    it("never counts an unknown custom type", () => {
        // Excluded by default is the safe direction: an unknown type cannot make a job fire.
        expect(
            route({
                model: model([
                    field({ fieldId: "intro", type: "my-custom-field" }),
                    field({ fieldId: "body", type: "my-custom-field" })
                ])
            })
        ).toMatchObject({ kind: "deterministic", reason: "too-few-text-fields" });
    });

    it("skips one prose field in a quiet save", () => {
        // One rewritten field amid nothing else is described well enough by naming it.
        expect(
            route({
                before: { intro: prose("old"), body: "short" },
                after: { intro: prose("new"), body: "shorter" }
            })
        ).toMatchObject({ kind: "deterministic", reason: "too-few-text-fields" });
    });
});

describe("one prose field amid a busy save", () => {
    // The case requiring two prose fields got wrong: a body rewritten while several headings were
    // retouched is exactly what a sentence captures and a list of field names does not.
    const busyModel = model([
        field({ fieldId: "copy", type: "long-text" }),
        field({ fieldId: "h1" }),
        field({ fieldId: "h2" }),
        field({ fieldId: "h3" })
    ]);

    const busy = (pathCount: number) =>
        route({
            model: busyModel,
            changeset: [change("copy"), change("h1"), change("h2"), change("h3")].slice(
                0,
                pathCount
            ),
            before: { copy: prose("old"), h1: "A", h2: "B", h3: "C" },
            after: { copy: prose("new"), h1: "D", h2: "E", h3: "F" }
        });

    it("dispatches at the total-path threshold", () => {
        expect(busy(DEFAULT_ACTIVITY_SUMMARY_CONFIG.singleFreeTextMinPaths).kind).toBe("ai");
    });

    it("skips one below it", () => {
        expect(busy(DEFAULT_ACTIVITY_SUMMARY_CONFIG.singleFreeTextMinPaths - 1)).toMatchObject({
            kind: "deterministic",
            reason: "too-few-text-fields"
        });
    });

    it("still needs at least one prose field, however busy the save", () => {
        // A scatter of short edits is not made interesting by being numerous.
        expect(
            route({
                model: model([
                    field({ fieldId: "a" }),
                    field({ fieldId: "b" }),
                    field({ fieldId: "c" }),
                    field({ fieldId: "d" })
                ]),
                changeset: [change("a"), change("b"), change("c"), change("d")],
                before: { a: "1", b: "2", c: "3", d: "4" },
                after: { a: "5", b: "6", c: "7", d: "8" }
            })
        ).toMatchObject({ kind: "deterministic", reason: "too-few-text-fields" });
    });
});

describe("the value ceiling", () => {
    it("skips a bundle over the ceiling", () => {
        const huge = "x".repeat(60 * 1024);

        expect(
            route({
                before: { intro: huge, body: huge },
                after: { intro: `${huge}!`, body: `${huge}!` }
            })
        ).toMatchObject({ kind: "deterministic", reason: "values-too-large" });
    });

    it("stops the model rather than the description", () => {
        // The ceiling bounds what gets written to a record and sent to a provider. It was never
        // about whether the change can be described: the renderer characterises what it cannot
        // quote, so an enormous value still produces a sentence-length sentence.
        const huge = "x".repeat(60 * 1024);
        const decision = route({
            before: { intro: huge, body: huge },
            after: { intro: `${huge}!`, body: `${huge}!` }
        });

        expect(decision.kind).toBe("deterministic");
        // The values are in hand for the renderer and go no further — asserted where that is
        // decided, in the dispatcher, rather than here.
        expect(decision.kind === "deterministic" && decision.values).toHaveLength(2);
    });
});

describe("the switches", () => {
    it("skips everything when summaries are off", () => {
        expect(
            route({ config: { ...DEFAULT_ACTIVITY_SUMMARY_CONFIG, enabled: false } })
        ).toMatchObject({
            kind: "deterministic",
            reason: "disabled"
        });
    });

    it("skips when no model is configured", () => {
        // An installation entitled to the activity log but not to AI gets the timeline and no
        // sentences, which is the same degradation as an unconfigured provider.
        expect(route({ aiAvailable: false })).toMatchObject({
            kind: "deterministic",
            reason: "ai-unavailable"
        });
    });

    it("describes nothing for a machine write, whatever the switch says", () => {
        // Ordering, and it changed when the renderer arrived. `not-interactive` now wins over
        // `disabled`, because the switch governs whether content reaches a model and a machine
        // write gets no sentence of any kind either way.
        expect(
            route({
                config: { ...DEFAULT_ACTIVITY_SUMMARY_CONFIG, enabled: false },
                source: "api-key",
                aiAvailable: false,
                changeset: []
            })
        ).toMatchObject({ kind: "none", reason: "not-interactive" });
    });

    it("still describes an editor's save when the switch is off", () => {
        // The point of the switch, now that there are two generators: no content leaves the
        // installation, and the timeline still says what changed.
        expect(
            route({ config: { ...DEFAULT_ACTIVITY_SUMMARY_CONFIG, enabled: false } })
        ).toMatchObject({ kind: "deterministic", reason: "disabled" });
    });
});
