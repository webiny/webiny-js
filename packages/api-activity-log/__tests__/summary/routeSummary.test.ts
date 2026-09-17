import { describe, expect, it } from "vitest";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { ChangesetEntry } from "~/core/types.js";
import { routeSummary } from "~/cms/summary/routeSummary.js";
import { DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "~/cms/summary/config.js";

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

const change = (path: string, operation?: string): ChangesetEntry => ({
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

        expect(decision.dispatch).toBe(true);
        expect(decision.dispatch && decision.values).toHaveLength(2);
    });

    it("carries before and after for every changed path", () => {
        const decision = route();

        expect(decision.dispatch && decision.values[0]).toMatchObject({
            path: "intro",
            label: "intro"
        });
        expect(decision.dispatch && decision.values[0]!.before).toContain("old intro");
        expect(decision.dispatch && decision.values[0]!.after).toContain("new intro");
    });
});

describe("who wrote it", () => {
    it("skips an API key", () => {
        // Machine traffic is where the volume is, and it is the one origin that can be told apart.
        expect(route({ source: "api-key" })).toEqual({
            dispatch: false,
            reason: "not-interactive"
        });
    });

    it("skips anything a background task performed", () => {
        // Covers bulk operations, which run as tasks and carry a `task:` source.
        expect(route({ source: "task:hcmsBulkProcessEntries" })).toEqual({
            dispatch: false,
            reason: "not-interactive"
        });
    });

    it("skips a system write", () => {
        expect(route({ source: "system" })).toEqual({
            dispatch: false,
            reason: "not-interactive"
        });
    });

    it("does not skip a script using a person's token, because it cannot tell", () => {
        // Stated as a test rather than left implicit: this is the gap the identity rule does not
        // close, and it should fail loudly if someone later believes it does.
        expect(route({ source: "admin" }).dispatch).toBe(true);
    });
});

describe("what changed", () => {
    it("skips when there is no before state at all", () => {
        expect(route({ before: undefined })).toEqual({
            dispatch: false,
            reason: "structural-only"
        });
    });

    it("skips an empty changeset", () => {
        expect(route({ changeset: [] })).toEqual({
            dispatch: false,
            reason: "structural-only"
        });
    });

    it("skips when every change is structural", () => {
        expect(
            route({
                changeset: [change("blocks#a1", "added"), change("blocks#b2", "moved")]
            })
        ).toEqual({ dispatch: false, reason: "structural-only" });
    });

    it("still routes when a structural change sits alongside prose", () => {
        const decision = route({
            changeset: [change("intro"), change("body"), change("blocks#a1", "added")]
        });

        expect(decision.dispatch).toBe(true);
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
            }).dispatch
        ).toBe(true);
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
        ).toEqual({ dispatch: false, reason: "too-many-paths" });
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

        expect(decision.dispatch).toBe(true);
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

        expect(decision.dispatch).toBe(true);
    });

    it("skips short text fields, which are the common save", () => {
        // A title and a slug changing. The deterministic description already reads perfectly.
        expect(
            route({
                before: { intro: "Spring launch", body: "/campaigns/aurora" },
                after: { intro: "Summer launch", body: "/campaigns/solstice" }
            })
        ).toEqual({ dispatch: false, reason: "too-few-text-fields" });
    });

    it("counts a text field at exactly the threshold", () => {
        const at = "x".repeat(DEFAULT_ACTIVITY_SUMMARY_CONFIG.freeTextMinLength);

        expect(
            route({ before: { intro: at, body: at }, after: { intro: "a", body: "b" } }).dispatch
        ).toBe(true);
    });

    it("skips a text field one character below the threshold", () => {
        const below = "x".repeat(DEFAULT_ACTIVITY_SUMMARY_CONFIG.freeTextMinLength - 1);

        expect(
            route({ before: { intro: below, body: below }, after: { intro: "a", body: "b" } })
        ).toEqual({ dispatch: false, reason: "too-few-text-fields" });
    });

    it("measures the longer side, so deleting a paragraph counts", () => {
        // The after is empty. Without the max() this would read as a short change.
        expect(
            route({
                before: { intro: prose("gone"), body: prose("also") },
                after: { intro: "", body: "" }
            }).dispatch
        ).toBe(true);
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
        ).toEqual({ dispatch: false, reason: "too-few-text-fields" });
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
        ).toEqual({ dispatch: false, reason: "too-few-text-fields" });
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
        ).toEqual({ dispatch: false, reason: "too-few-text-fields" });
    });

    it("needs two, not one", () => {
        expect(
            route({
                before: { intro: prose("old"), body: "short" },
                after: { intro: prose("new"), body: "shorter" }
            })
        ).toEqual({ dispatch: false, reason: "too-few-text-fields" });
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
        ).toEqual({ dispatch: false, reason: "values-too-large" });
    });

    it("stores nothing when it skips for size", () => {
        // The point of the ceiling: no job *and* no values. A trimmed bundle would make a model
        // describe half a change just as confidently.
        const huge = "x".repeat(60 * 1024);
        const decision = route({
            before: { intro: huge, body: huge },
            after: { intro: `${huge}!`, body: `${huge}!` }
        });

        expect(decision.dispatch).toBe(false);
        expect(decision).not.toHaveProperty("values");
    });
});

describe("the switches", () => {
    it("skips everything when summaries are off", () => {
        expect(route({ config: { ...DEFAULT_ACTIVITY_SUMMARY_CONFIG, enabled: false } })).toEqual({
            dispatch: false,
            reason: "disabled"
        });
    });

    it("skips when no model is configured", () => {
        // An installation entitled to the activity log but not to AI gets the timeline and no
        // sentences, which is the same degradation as an unconfigured provider.
        expect(route({ aiAvailable: false })).toEqual({
            dispatch: false,
            reason: "ai-unavailable"
        });
    });

    it("checks the switch before anything expensive", () => {
        // Ordering matters: `disabled` must win over every other reason, or an installation with
        // summaries off would still pay to classify and bundle.
        expect(
            route({
                config: { ...DEFAULT_ACTIVITY_SUMMARY_CONFIG, enabled: false },
                source: "api-key",
                aiAvailable: false,
                changeset: []
            })
        ).toEqual({ dispatch: false, reason: "disabled" });
    });
});
