import { describe, expect, it } from "vitest";
import { buildPlanRefinePrompt, parsePlanContract } from "./planContract.js";
import type { ClassifiedCluster, ComponentProp } from "~/domain/artifacts.js";

const contract = (props: unknown): string => JSON.stringify({ props, tokenBindings: [] });

// A minimal cluster with the fields the refine prompt reads (type, name, digest, members, observedTexts).
const cluster = (members: number): ClassifiedCluster =>
    ({
        type: "feature-grid",
        name: "FeatureGrid",
        cluster: {
            digest: { structure: "grid", headingCount: 1, imageCount: 3, linkCount: 0 },
            members: Array.from({ length: members }, (_, i) => ({ url: `/p${i}` })),
            observedTexts: ["Feature one", "Feature two"]
        }
    }) as unknown as ClassifiedCluster;

describe("parsePlanContract", () => {
    it("keeps the base type and reads the optional/array flags", () => {
        const result = parsePlanContract(
            contract([
                { name: "eyebrow", type: "string", optional: true, observedValues: ["A", "B"] },
                { name: "items", type: "FeatureItem", array: true, observedValues: [] }
            ])
        );
        expect(result?.props[0]).toMatchObject({ name: "eyebrow", type: "string", optional: true });
        expect(result?.props[0].array ?? false).toBe(false);
        expect(result?.props[1]).toMatchObject({ type: "FeatureItem", array: true });
    });

    it("parses nested fields recursively and caps depth", () => {
        const deep = {
            name: "a",
            type: "object",
            fields: [
                {
                    name: "b",
                    type: "object",
                    fields: [
                        {
                            name: "c",
                            type: "object",
                            // 4th level — beyond MAX_PROP_DEPTH (3), must be dropped.
                            fields: [{ name: "d", type: "string", observedValues: [] }],
                            observedValues: []
                        }
                    ],
                    observedValues: []
                }
            ],
            observedValues: []
        };
        const result = parsePlanContract(contract([deep]));
        const a = result?.props[0];
        const b = a?.fields?.[0];
        const c = b?.fields?.[0];
        expect(a?.fields).toHaveLength(1);
        expect(b?.fields).toHaveLength(1);
        expect(c?.name).toBe("c");
        // The 4th level is not carried.
        expect(c?.fields).toBeUndefined();
    });

    it("parses observation stats and filters malformed valueCounts", () => {
        const result = parsePlanContract(
            contract([
                {
                    name: "columns",
                    type: "2 | 3 | 4",
                    observedValues: [],
                    observation: {
                        presentInstances: 9,
                        countMin: null,
                        countMax: null,
                        valueCounts: [
                            { value: "3", count: 7 },
                            { value: "4", count: 2 },
                            { count: 1 } // no value — dropped
                        ]
                    }
                }
            ])
        );
        const obs = result?.props[0].observation;
        expect(obs?.presentInstances).toBe(9);
        expect(obs?.valueCounts).toEqual([
            { value: "3", count: 7 },
            { value: "4", count: 2 }
        ]);
    });

    it("stamps the grounded instance count onto every prop and nested field", () => {
        const result = parsePlanContract(
            contract([
                {
                    name: "media",
                    type: "Image",
                    observedValues: [],
                    // A model-supplied total that must be overridden by the grounded count.
                    observation: { presentInstances: 6, totalInstances: 999 },
                    fields: [{ name: "src", type: "url", observedValues: [] }]
                }
            ]),
            6
        );
        expect(result?.props[0].observation?.totalInstances).toBe(6);
        expect(result?.props[0].observation?.presentInstances).toBe(6);
        expect(result?.props[0].fields?.[0].observation?.totalInstances).toBe(6);
    });

    it("skips props missing a name or type", () => {
        const result = parsePlanContract(
            contract([{ type: "string" }, { name: "ok", type: "string", observedValues: [] }])
        );
        expect(result?.props).toHaveLength(1);
        expect(result?.props[0].name).toBe("ok");
    });
});

describe("buildPlanRefinePrompt", () => {
    const current: { props: ComponentProp[]; tokenBindings: [] } = {
        props: [
            { name: "features", type: "Feature", array: true, observedValues: [] },
            { name: "columns", type: "number", observedValues: [] }
        ],
        tokenBindings: []
    };

    it("echoes the current contract and instructs an edit-in-place, no-regression refinement", () => {
        const prompt = buildPlanRefinePrompt(
            cluster(9),
            null,
            current,
            [],
            "drop the columns field"
        );
        // Current contract is echoed so the model edits rather than re-proposes.
        expect(prompt).toContain('"features"');
        expect(prompt).toContain('"columns"');
        expect(prompt).toContain("New instruction: drop the columns field");
        // The guardrails that stop the circular churn.
        expect(prompt).toContain("Change ONLY what the instruction");
        expect(prompt).toContain("Never re-introduce a prop an earlier refinement removed");
    });

    it("carries the full refinement history forward, oldest first", () => {
        const prompt = buildPlanRefinePrompt(
            cluster(9),
            null,
            current,
            ["drop the columns field — count the items instead", "add an icon field"],
            "keep icon as a dropdown"
        );
        expect(prompt).toContain("1. drop the columns field — count the items instead");
        expect(prompt).toContain("2. add an icon field");
        expect(prompt).toContain("New instruction: keep icon as a dropdown");
    });

    it("still produces a coherent prompt with no new instruction (re-roll honouring history)", () => {
        const prompt = buildPlanRefinePrompt(
            cluster(9),
            null,
            current,
            ["drop columns"],
            undefined
        );
        expect(prompt).toContain("No new instruction");
        expect(prompt).toContain("1. drop columns");
    });
});
