// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { stageToFollow } from "./followStage.js";
import type { RunDto } from "~/shared/types.js";

const run = (statuses: Record<string, string>): RunDto =>
    ({
        id: "r",
        jobId: "j",
        runNumber: 1,
        status: "running",
        note: null,
        counts: {},
        createdOn: "",
        stages: Object.entries(statuses).map(([stage, status]) => ({ stage, status }))
    }) as unknown as RunDto;

describe("stageToFollow", () => {
    it("moves on with the run when the stage being watched hands over to the next", () => {
        const before = run({ classify: "running", plan: "pending" });
        const after = run({ classify: "done", plan: "running" });

        expect(stageToFollow("classify", before, after)).toBe("plan");
    });

    it("moves on when the handover happened between two refreshes", () => {
        const before = run({ classify: "done", plan: "pending" });
        const after = run({ classify: "done", plan: "running" });

        expect(stageToFollow("classify", before, after)).toBe("plan");
    });

    it("leaves someone looking at another stage where they are", () => {
        const before = run({ classify: "running", plan: "pending" });
        const after = run({ classify: "done", plan: "running" });

        expect(stageToFollow("discover", before, after)).toBeNull();
    });

    it("stays put while the same stage keeps running", () => {
        const running = run({ classify: "running" });

        expect(stageToFollow("discover", running, running)).toBeNull();
        expect(stageToFollow("classify", running, running)).toBeNull();
    });

    it("stays put when nothing is running", () => {
        expect(stageToFollow("plan", null, run({ plan: "done" }))).toBeNull();
    });
});
