import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { StageArtifactStore } from "~/domain/stage.js";
import { recordResultOnce } from "./recordResultOnce.js";
import { attemptBudget } from "./componentGeneration.js";

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

const result = (name: string) => ({
    signature: "sig",
    component: { name } as never,
    revision: 1
});

describe("recordResultOnce", () => {
    it("records the first result", async () => {
        const { store, data } = memoryStore();
        const written = await recordResultOnce(store, "k", result("first"));
        expect(written.isOk() && written.value).toBe("recorded");
        expect((data.get("k") as ReturnType<typeof result>).component).toEqual({ name: "first" });
    });

    it("never overwrites a result another task recorded first", async () => {
        const { store, data } = memoryStore();
        await recordResultOnce(store, "k", result("first"));
        const late = await recordResultOnce(store, "k", result("late duplicate"));
        expect(late.isOk() && late.value).toBe("already-recorded");
        expect((data.get("k") as ReturnType<typeof result>).component).toEqual({ name: "first" });
    });
});

describe("attemptBudget", () => {
    const now = 1_000_000;

    it("gives each call the full limit when there is no deadline", () => {
        expect(attemptBudget(now, undefined)).toEqual({ proceed: true, timeoutMs: 420_000 });
    });

    it("gives the full limit when plenty of time is left", () => {
        expect(attemptBudget(now, now + 14 * 60_000)).toEqual({
            proceed: true,
            timeoutMs: 420_000
        });
    });

    it("still gives a second long attempt enough to finish a Footer", () => {
        // An 880 s invocation after a full first attempt (420 s call + overhead): 450 s left.
        expect(attemptBudget(now, now + 450_000)).toEqual({ proceed: true, timeoutMs: 390_000 });
    });

    it("shortens the call to leave time to record the result", () => {
        expect(attemptBudget(now, now + 3 * 60_000)).toEqual({ proceed: true, timeoutMs: 120_000 });
    });

    it("starts no attempt with too little time left", () => {
        expect(attemptBudget(now, now + 60_000).proceed).toBe(false);
    });
});
