import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { Result } from "@webiny/feature/api";
import type { PlannedComponent } from "~/domain/artifacts.js";
import {
    GENERATION_EFFORT,
    generateComponentAttempts,
    type GenerationDeps
} from "./componentGeneration.js";

// The reference image is written to S3 before its File Manager record is created; no S3 in a test.
vi.mock("@webiny/aws-sdk/client-s3/index.js", () => ({
    createS3: () => ({ send: async () => ({}) }),
    PutObjectCommand: class {
        constructor(readonly input: unknown) {}
    }
}));

const crop = async () =>
    new Uint8Array(
        await sharp({
            create: { width: 40, height: 20, channels: 3, background: { r: 0, g: 0, b: 0 } }
        })
            .png()
            .toBuffer()
    );

const planned = (cropRef: string): PlannedComponent =>
    ({
        signature: "sig",
        name: "Hero",
        type: "hero",
        props: [],
        tokenBindings: [],
        members: [],
        representativeCrop: {
            screenshotRef: "",
            box: { x: 0, y: 0, width: 40, height: 20 },
            cropRef
        },
        sourceTexts: [],
        clusterTexts: []
    }) as unknown as PlannedComponent;

const setup = async (overrides: { cropRead?: "ok" | "fail"; createFile?: "ok" | "fail" }) => {
    const generate = vi.fn(async () => Result.fail(new Error("not reached in these tests")));
    const bytes = await crop();
    const deps = {
        generateComponent: { execute: generate },
        createFile: {
            execute: async () =>
                overrides.createFile === "fail"
                    ? Result.fail(new Error("File Manager is unavailable"))
                    : Result.ok({ id: "file-1" })
        },
        tenantContext: { getTenant: () => ({ id: "root" }) },
        blobs: {
            get: async () =>
                overrides.cropRead === "fail"
                    ? Result.fail(new Error("NoSuchKey"))
                    : Result.ok(bytes)
        }
    } as unknown as GenerationDeps;
    return { deps, generate };
};

const input = (cropRef: string) => ({
    runId: "run",
    stageVersion: 1,
    planned: planned(cropRef),
    validVariables: new Set<string>(),
    manifestAvailable: false,
    slotVariables: new Map<string, string[]>(),
    log: async () => undefined,
    beat: async () => undefined
});

describe("generateComponentAttempts — no reference image, no model call", () => {
    it("records a component with no crop as not generated", async () => {
        const { deps, generate } = await setup({});
        const outcome = await generateComponentAttempts(deps, input(""));
        expect(generate).not.toHaveBeenCalled();
        expect(outcome).toEqual({
            component: null,
            notGenerated: "no member of the cluster has a usable reference crop"
        });
    });

    it("records a component whose crop cannot be read as not generated", async () => {
        const { deps, generate } = await setup({ cropRead: "fail" });
        const outcome = await generateComponentAttempts(deps, input("crop-1"));
        expect(generate).not.toHaveBeenCalled();
        expect(outcome.component).toBeNull();
        expect(outcome.notGenerated).toBe("the reference crop could not be read: NoSuchKey");
    });

    it("records a component whose reference file cannot be created as not generated", async () => {
        const { deps, generate } = await setup({ createFile: "fail" });
        const outcome = await generateComponentAttempts(deps, input("crop-1"));
        expect(generate).not.toHaveBeenCalled();
        expect(outcome.component).toBeNull();
        expect(outcome.notGenerated).toBe(
            "the reference image could not be created: File Manager is unavailable"
        );
    });

    it("calls the model with the reference image when it can be made", async () => {
        const { deps, generate } = await setup({});
        const outcome = await generateComponentAttempts(deps, input("crop-1"));
        expect(generate).toHaveBeenCalled();
        expect(generate.mock.calls[0]).toEqual([
            expect.objectContaining({ additionalFileIds: ["file-1"] })
        ]);
        // Every attempt failed here, which is not the same as not attempting.
        expect(outcome.notGenerated).toBeUndefined();
    });
});

describe("generateComponentAttempts — effort", () => {
    const sent = (generate: ReturnType<typeof vi.fn>) =>
        (generate.mock.calls[0] as unknown as [{ effort?: string }])[0].effort;

    it("sends medium effort by default", async () => {
        const { deps, generate } = await setup({});
        await generateComponentAttempts(deps, input("crop.png"));
        expect(GENERATION_EFFORT).toBe("medium");
        expect(sent(generate)).toBe("medium");
    });

    it("sends an experiment's effort instead", async () => {
        const { deps, generate } = await setup({});
        await generateComponentAttempts(deps, { ...input("crop.png"), effort: "high" });
        expect(sent(generate)).toBe("high");
    });
});

describe("generateComponentAttempts — install", () => {
    it("installs the given output without calling the model, in one attempt", async () => {
        const { deps, generate } = await setup({});
        const records: { attempt: number; maxAttempts: number }[] = [];
        await generateComponentAttempts(deps, {
            ...input("crop.png"),
            install: { source: "export default function Hero() { return null; }", css: "" },
            recordAttempt: async record => {
                records.push({ attempt: record.attempt, maxAttempts: record.maxAttempts });
            }
        });
        expect(generate).not.toHaveBeenCalled();
        expect(records).toEqual([{ attempt: 1, maxAttempts: 1 }]);
    });
});
