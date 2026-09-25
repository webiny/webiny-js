import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import {
    componentContentSha256,
    componentsMetadata,
    readComponent,
    readComponents,
    toComponentRef
} from "./generatedComponents.js";
import type { GenerateArtifact, GeneratedComponent } from "./artifacts.js";

const component = (overrides: Partial<GeneratedComponent> = {}): GeneratedComponent => ({
    signature: "sig-1",
    name: "Hero",
    type: "hero",
    source: "export default function Hero() { return <h1>hi</h1>; }",
    css: ".hero { color: red; }",
    props: [{ name: "title" }] as GeneratedComponent["props"],
    tokenBindings: [],
    members: [
        { url: "https://example.com/", signature: "sig-1" },
        { url: "https://example.com/", signature: "sig-1" },
        { url: "https://example.com/about", signature: "sig-1" }
    ] as GeneratedComponent["members"],
    attempts: 1,
    validation: {
        bundling: { passed: true, failures: [] },
        textPreservation: { passed: true, failures: [] },
        contractConformance: { passed: true, failures: [] },
        tokenBinding: { passed: true, failures: [] }
    },
    ...overrides
});

/** A store that records what was asked for, so "did this fetch?" is answerable rather than assumed. */
const storeWith = (entries: Record<string, unknown>) => {
    const reads: string[] = [];
    return {
        reads,
        store: {
            putJson: async () => Result.ok(undefined),
            getJson: async <T>(key: string) => {
                reads.push(key);
                return Result.ok((entries[key] ?? null) as T | null);
            }
        }
    };
};

describe("generated component references", () => {
    it("keeps the aggregate entry free of the heavy fields", () => {
        const ref = toComponentRef(component(), "result-key", 3);

        expect(ref).not.toHaveProperty("source");
        expect(ref).not.toHaveProperty("css");
        expect(ref).not.toHaveProperty("members");
        expect(ref).not.toHaveProperty("props");
        expect(ref.resultRef).toBe("result-key");
        expect(ref.revision).toBe(3);
    });

    it("counts pages as distinct member urls, not members", () => {
        // Two instances on one page and one on another: 3 members, 2 pages. The Generate and Promote
        // views show the page count, and it is not derivable from the member count.
        const ref = toComponentRef(component(), "result-key", 1);

        expect(ref.memberCount).toBe(3);
        expect(ref.pageCount).toBe(2);
    });

    it("moves the content hash when content changes and not when it does not", () => {
        const first = componentContentSha256(component());
        const same = componentContentSha256(component());
        const edited = componentContentSha256(component({ source: "different" }));

        expect(same).toBe(first);
        expect(edited).not.toBe(first);
    });

    it("does not move the content hash for a no-op refine, which is why revision exists", () => {
        // Refining is a model call that may hand back exactly what it was given. Anything derived from
        // content cannot detect that a refine happened, so completion is detected with `revision`.
        const before = component();
        const after = component();

        expect(componentContentSha256(after)).toBe(componentContentSha256(before));
        expect(toComponentRef(after, "k", 2).revision).not.toBe(
            toComponentRef(before, "k", 1).revision
        );
    });

    it("resolves a referencing artifact by fetching each component", async () => {
        const target = component();
        const { store, reads } = storeWith({
            "result-key": { signature: "sig-1", component: target, revision: 1 }
        });
        const artifact: GenerateArtifact = {
            components: [toComponentRef(target, "result-key", 1)],
            failed: []
        };

        const resolved = await readComponents(store as never, artifact);

        expect(resolved.isOk()).toBe(true);
        expect(resolved.value[0].source).toBe(target.source);
        expect(reads).toEqual(["result-key"]);
    });

    it("reads an artifact written before components were referenced, without fetching", async () => {
        // Every existing run carries its components inline. One resolver handles both shapes so that
        // eight consumers do not each carry the branch.
        const { store, reads } = storeWith({});
        const artifact = { components: [component()], failed: [] } as unknown as GenerateArtifact;

        const resolved = await readComponents(store as never, artifact);

        expect(resolved.isOk()).toBe(true);
        expect(resolved.value[0].source).toBe(component().source);
        expect(reads).toEqual([]);
    });

    it("gives metadata for either shape without fetching", async () => {
        const inline = { components: [component()], failed: [] } as unknown as GenerateArtifact;
        const referencing: GenerateArtifact = {
            components: [toComponentRef(component(), "result-key", 1)],
            failed: []
        };

        for (const artifact of [inline, referencing]) {
            const metadata = componentsMetadata(artifact);

            expect(metadata[0].name).toBe("Hero");
            expect(metadata[0].pageCount).toBe(2);
            expect(metadata[0]).not.toHaveProperty("source");
        }
    });

    it("fails rather than skipping when a referenced component is missing", async () => {
        // The aggregate said the component is there. Silently skipping it would assemble or promote a
        // run with components quietly absent, which is worse than stopping.
        const { store } = storeWith({});
        const artifact: GenerateArtifact = {
            components: [toComponentRef(component(), "gone", 1)],
            failed: []
        };

        const resolved = await readComponent(store as never, artifact.components[0]);

        expect(resolved.isFail()).toBe(true);
        expect(String(resolved.error.message)).toContain("missing");
    });
});
