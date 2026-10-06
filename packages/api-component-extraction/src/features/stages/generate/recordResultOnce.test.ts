import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { StageArtifactStore } from "~/domain/stage.js";
import { recordResultOnce } from "./recordResultOnce.js";

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
