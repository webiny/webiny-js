import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { GenerateArtifact, GeneratedComponent, RenderArtifact } from "~/domain/artifacts.js";
import type { StageArtifactStore } from "~/domain/stage.js";
import { stageArtifactKey } from "~/constants.js";
import { generateResultKey, type ComponentResult } from "./componentGeneration.js";
import { replaceGeneratedComponent } from "./replaceGeneratedComponent.js";

const memoryStore = () => {
    const data = new Map<string, unknown>();
    const store = {
        getJson: async (key: string) => Result.ok(data.get(key) ?? null),
        putJson: async (key: string, value: unknown) => {
            data.set(key, value);
            return Result.ok(undefined);
        }
    } as unknown as StageArtifactStore.Interface;
    return { store, data };
};

const passed = { passed: true, failures: [] };
const component = (signature: string, textPassed: boolean): GeneratedComponent =>
    ({
        signature,
        name: signature === "hdr" ? "Site Header" : "Footer",
        type: "header",
        source: `export default function C() { return null; } // ${textPassed}`,
        css: "",
        props: [],
        tokenBindings: [],
        members: [],
        attempts: 1,
        validation: {
            bundling: passed,
            textPreservation: textPassed
                ? passed
                : { passed: false, failures: ['text not on the source page: "Apply Now"'] },
            contractConformance: passed,
            tokenBinding: passed
        }
    }) as unknown as GeneratedComponent;

describe("replaceGeneratedComponent", () => {
    const runId = "run#0001";
    const componentsKey = "components-key";

    const seed = (store: Map<string, unknown>) => {
        store.set(generateResultKey(runId, 1, "hdr"), {
            signature: "hdr",
            component: component("hdr", false),
            revision: 1
        } satisfies ComponentResult);
        store.set(componentsKey, {
            components: [{ signature: "hdr" }, { signature: "ftr" }],
            failed: ["hdr"]
        } as unknown as GenerateArtifact);
        store.set(stageArtifactKey(runId, "generate", 1, "renders"), {
            renders: [{ signature: "hdr" }, { signature: "ftr" }]
        } as unknown as RenderArtifact);
    };

    it("writes the new component over the old, bumps its revision and clears its failure", async () => {
        const { store, data } = memoryStore();
        seed(data);
        const replaced = await replaceGeneratedComponent(store, {
            runId,
            stageVersion: 1,
            componentsKey,
            component: component("hdr", true)
        });
        expect(replaced.isOk() && replaced.value.revision).toBe(2);
        const result = data.get(generateResultKey(runId, 1, "hdr")) as ComponentResult;
        expect(result.revision).toBe(2);
        expect(result.component?.validation.textPreservation.passed).toBe(true);
        const aggregate = data.get(componentsKey) as GenerateArtifact;
        expect(aggregate.failed).toEqual([]);
        expect(aggregate.components.map(entry => entry.signature)).toEqual(["hdr", "ftr"]);
        expect(aggregate.components[0].revision).toBe(2);
    });

    it("drops only that component's render, which shows the old one", async () => {
        const { store, data } = memoryStore();
        seed(data);
        await replaceGeneratedComponent(store, {
            runId,
            stageVersion: 1,
            componentsKey,
            component: component("hdr", true)
        });
        const renders = data.get(
            stageArtifactKey(runId, "generate", 1, "renders")
        ) as RenderArtifact;
        expect(renders.renders.map(record => record.signature)).toEqual(["ftr"]);
    });

    it("keeps a component that still fails validation listed as failed", async () => {
        const { store, data } = memoryStore();
        seed(data);
        await replaceGeneratedComponent(store, {
            runId,
            stageVersion: 1,
            componentsKey,
            component: component("hdr", false)
        });
        expect((data.get(componentsKey) as GenerateArtifact).failed).toEqual(["hdr"]);
    });
});
