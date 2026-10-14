// @vitest-environment jsdom
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { JobListItemDto } from "~/shared/types.js";
import {
    boardColumn,
    failureOf,
    isMine,
    jobOwner,
    matchesSearch,
    ownerOf,
    SHARED_LOGIN_IDS,
    sortColumn,
    timingOf
} from "./jobBoard.js";

/* The dev instance's 27 jobs as the list query returned them on 2026-10-12. */
const fixture = JSON.parse(
    readFileSync(join(__dirname, "__fixtures__", "list-jobs-2026-10-12.json"), "utf8")
) as { data: JobListItemDto[] };
const items = fixture.data;
const byName = (name: string) => items.find(item => item.job.name === name)!;

const SHARED = { id: SHARED_LOGIN_IDS[0]!, displayName: "Webiny Admin", type: "admin" };
const ANA = { id: "ana-1", displayName: "Ana Kovač", type: "admin" };

describe("the board's columns, on the dev instance's jobs", () => {
    it("puts each job in one column, with a run waiting for its next stage under needs review", () => {
        const counts: Record<string, number> = {};
        for (const item of items) {
            const column = boardColumn(item.latestRun);
            counts[column] = (counts[column] ?? 0) + 1;
        }
        expect(counts).toEqual({ complete: 9, "needs-review": 17, failed: 1 });
        // "running" on the run record while no stage runs: waiting for someone, not running.
        expect(byName("TheVibe Baseline").latestRun!.status).toBe("running");
        expect(boardColumn(byName("TheVibe Baseline").latestRun)).toBe("needs-review");
    });

    it("puts a cancelled run with the failed, with its fixed reason", () => {
        const cancelled = byName("FreehillStreetLofts Fixes Check");
        expect(boardColumn(cancelled.latestRun)).toBe("failed");
        expect(failureOf(cancelled.latestRun)).toBe("Cancelled before it finished.");
        expect(timingOf(cancelled).verb).toBe("Cancelled");
    });

    it("counts a run that never started a stage as waiting since the run was made", () => {
        const fresh = byName("Theme failure check (2026-10-09)");
        expect(boardColumn(fresh.latestRun)).toBe("needs-review");
        expect(timingOf(fresh)).toEqual({ verb: "Waiting", at: fresh.latestRun!.createdOn });
    });

    it("counts waiting from the finish of the stage before the next one", () => {
        const waiting = byName("TheVibe Baseline");
        const assemble = waiting.latestRun!.stages.find(entry => entry.stage === "assemble")!;
        expect(timingOf(waiting)).toEqual({ verb: "Waiting", at: assemble.finishedOn });
    });

    it("dates a complete job by when Approve components finished", () => {
        const done = byName("71 Westland — rehearsal (2026-10-09)");
        const promote = done.latestRun!.stages.find(entry => entry.stage === "promote")!;
        expect(timingOf(done)).toEqual({ verb: "Finished", at: promote.finishedOn });
    });

    it("puts a job with no run under not started, dated by its creation", () => {
        const job = { ...items[0]!, latestRun: null };
        expect(boardColumn(null)).toBe("not-started");
        expect(timingOf(job)).toEqual({ verb: "Created", at: job.job.createdOn });
    });

    it("sorts a column oldest first or newest first by that time", () => {
        const review = items.filter(item => boardColumn(item.latestRun) === "needs-review");
        const oldest = sortColumn(review, "oldest").map(item => timingOf(item).at);
        expect(oldest).toEqual([...oldest].sort());
        expect(sortColumn(review, "newest").map(item => timingOf(item).at)).toEqual(
            [...oldest].reverse()
        );
    });
});

describe("ownership", () => {
    it("reads the shared admin login and API keys as a shared login, never as a person", () => {
        expect(ownerOf(SHARED)).toMatchObject({
            label: "Shared login",
            shared: true,
            account: "Shared admin login: Webiny Admin"
        });
        expect(
            ownerOf({ id: "key-1", displayName: "Universal API Key", type: "api-key" })
        ).toMatchObject({
            label: "Shared login",
            shared: true,
            account: "API key: Universal API Key"
        });
        expect(ownerOf(null)).toMatchObject({ label: "Not recorded", shared: true });
    });

    it("names a person by the name their login carries", () => {
        expect(ownerOf(ANA)).toEqual({
            label: "Ana Kovač",
            account: "Ana Kovač",
            shared: false,
            initials: "AK"
        });
    });

    it("counts a job as mine only when my login created it", () => {
        const job = (createdBy: typeof ANA | null): JobListItemDto => ({
            ...items[0]!,
            job: { ...items[0]!.job, createdBy }
        });
        expect(isMine(job(ANA), "ana-1")).toBe(true);
        expect(isMine(job(SHARED), "ana-1")).toBe(false);
        expect(isMine(job(null), "ana-1")).toBe(false);
        expect(isMine(job(ANA), null)).toBe(false);
    });

    it("follows the assigned owner, not the creator, once a job is assigned", () => {
        // A job the shared login created, assigned to Ana: hers, and no longer the shared login's.
        const assigned: JobListItemDto = {
            ...items[0]!,
            job: {
                ...items[0]!.job,
                createdBy: SHARED,
                owner: ANA,
                assignment: {
                    owner: ANA,
                    assignedBy: SHARED,
                    assignedOn: "2026-10-13T08:00:00.000Z"
                }
            }
        };
        expect(isMine(assigned, "ana-1")).toBe(true);
        expect(isMine(assigned, SHARED.id)).toBe(false);
        expect(matchesSearch(assigned, "kovač")).toBe(true);
        expect(ownerOf(jobOwner(assigned.job)).label).toBe("Ana Kovač");
    });

    it("reads the creator as the owner on an API without the owner field", () => {
        const older: JobListItemDto = { ...items[0]!, job: { ...items[0]!.job, createdBy: ANA } };
        delete older.job.owner;
        expect(isMine(older, "ana-1")).toBe(true);
        expect(jobOwner(older.job)).toEqual(ANA);
    });

    it("searches the job name, its site URL and its owner", () => {
        const job: JobListItemDto = { ...items[0]!, job: { ...items[0]!.job, createdBy: ANA } };
        expect(matchesSearch(job, "kovač")).toBe(true);
        expect(matchesSearch(job, "webiny.com")).toBe(true);
        expect(matchesSearch(job, "rehearsal")).toBe(true);
        expect(matchesSearch(job, "tulane")).toBe(false);
    });
});
