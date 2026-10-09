import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { initLedger } from "~/domain/ledger.js";
import type { Job, Run } from "~/domain/types.js";
import { JobThemeTaskHandlerImpl, type JobThemeTaskInput } from "./JobThemeTask.js";

const baseJob = (extra: Partial<Job> = {}): Job =>
    ({
        id: "job-1",
        name: "Westbrook",
        siteUrl: "https://westbrook.example",
        themeEntryId: "",
        themeVersion: 0,
        themeExtraction: null,
        ...extra
    }) as Job;

const setup = (options: {
    job?: Job;
    lockFree?: boolean;
    crawl?: "ok" | "fail";
    publish?: "ok" | "fail";
}) => {
    let job = options.job ?? baseJob();
    const doneStages = initLedger().map(entry => ({ ...entry, status: "done" as const }));
    let run = { id: "run-1", stages: doneStages } as unknown as Run;
    const progress: string[] = [];
    const jobs = {
        get: async () => Result.ok(job),
        update: async (_id: string, values: Partial<Job>) => {
            job = { ...job, ...values };
            if (values.themeExtraction?.step) {
                progress.push(values.themeExtraction.step);
            }
            return Result.ok(job);
        }
    };
    const runs = {
        get: async () => Result.ok(run),
        update: async (_id: string, values: Partial<Run>) => {
            run = { ...run, ...values };
            return Result.ok(run);
        }
    };
    const crawlSite = {
        execute: async (params: { onProgress?: (p: object) => Promise<void> }) => {
            if (options.crawl === "fail") {
                return Result.fail(new Error("the site could not be reached"));
            }
            await params.onProgress?.({
                pagesDone: 1,
                pagesTotal: 3,
                currentUrl: "https://westbrook.example/rent"
            });
            return Result.ok({ payload: { source: { sampledUrls: ["a", "b", "c"] } } });
        }
    };
    const analyseCrawl = {
        execute: async () =>
            Result.ok({
                themeId: "theme-9#0001",
                metadata: {
                    confidence: "medium",
                    uncertain: [{ path: "color.text.link", reason: "two link colours" }],
                    appliedCount: 44
                }
            })
    };
    const released: string[] = [];
    const lock = {
        acquire: async () => Result.ok(options.lockFree !== false),
        release: async (id: string) => {
            released.push(id);
            return Result.ok(undefined);
        },
        current: async () => Result.ok("someone-else")
    };
    const publishTheme = {
        execute: async () =>
            options.publish === "fail"
                ? Result.fail(new Error("the theme failed validation"))
                : Result.ok({ theme: { entryId: "theme-9", version: 1 }, warnings: [] })
    };
    const handler = new JobThemeTaskHandlerImpl(
        jobs as never,
        runs as never,
        crawlSite as never,
        analyseCrawl as never,
        lock as never,
        publishTheme as never
    );
    const controller = {
        runtime: { isAborted: () => false },
        logger: { info: async () => undefined, error: async () => undefined },
        response: {
            done: (message: string) => ({ kind: "done", message }),
            error: (message: string) => ({ kind: "error", message }),
            continue: (_input: unknown, options: { seconds: number }) => ({
                kind: "continue",
                seconds: options.seconds
            }),
            aborted: () => ({ kind: "aborted" })
        }
    };
    const input: JobThemeTaskInput = { jobId: "job-1", runId: "run-1", extractionId: "x-1" };
    return {
        run: (extra: Partial<JobThemeTaskInput> = {}) =>
            handler.run({
                input: { ...input, ...extra },
                controller
            } as never) as unknown as Promise<{ kind: string; message?: string; seconds?: number }>,
        job: () => job,
        run_: () => run,
        progress,
        released
    };
};

describe("JobThemeTask", () => {
    it("publishes the extracted draft and pins it, recording what extraction reported", async () => {
        const t = setup({});
        expect((await t.run()).kind).toBe("done");
        expect(t.job().themeEntryId).toBe("theme-9");
        expect(t.job().themeVersion).toBe(1);
        expect(t.job().themeExtraction).toMatchObject({
            status: "done",
            confidence: "medium",
            pagesSampled: 3,
            slotsApplied: 44,
            uncertain: [{ path: "color.text.link", reason: "two link colours" }]
        });
        expect(t.progress).toContain("read 1 of 3 pages, now reading /rent");
        expect(t.progress).toContain("analysing the crawled pages");
        expect(t.released).toEqual(["x-1"]);
    });

    it("records extraction's own reason on failure and pins nothing", async () => {
        const t = setup({ crawl: "fail" });
        expect((await t.run()).kind).toBe("error");
        expect(t.job().themeEntryId).toBe("");
        expect(t.job().themeExtraction).toMatchObject({
            status: "failed",
            error: "the site could not be reached"
        });
        expect(t.released).toEqual(["x-1"]);
    });

    it("pins nothing when the draft cannot be published", async () => {
        const t = setup({ publish: "fail" });
        expect((await t.run()).kind).toBe("error");
        expect(t.job().themeEntryId).toBe("");
        expect(t.job().themeExtraction?.error).toBe("the theme failed validation");
    });

    it("waits for the lock another extraction holds, and says so", async () => {
        const t = setup({ lockFree: false });
        const result = await t.run();
        expect(result).toEqual({ kind: "continue", seconds: 20 });
        expect(t.job().themeExtraction).toMatchObject({
            status: "waiting",
            step: "waiting for another theme extraction to finish"
        });
        expect(t.released).toEqual([]);
    });

    it("on a retry of a job that had a theme, re-pins and marks Cluster onward stale", async () => {
        const t = setup({ job: baseJob({ themeEntryId: "old", themeVersion: 2 }) });
        expect((await t.run({ retry: true })).kind).toBe("done");
        expect(t.job().themeEntryId).toBe("theme-9");
        const status = Object.fromEntries(
            t.run_().stages.map(entry => [entry.stage, entry.status])
        );
        expect(status).toMatchObject({
            segment: "done",
            cluster: "stale",
            plan: "stale",
            promote: "stale"
        });
    });
});
