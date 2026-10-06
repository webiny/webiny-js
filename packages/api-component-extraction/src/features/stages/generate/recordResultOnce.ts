import { Result } from "@webiny/feature/api";
import type { StageArtifactStore } from "~/domain/stage.js";
import type { ExtractionError } from "~/domain/errors.js";
import type { ComponentResult } from "./componentGeneration.js";

/**
 * A component's result is recorded once: the first task to finish it wins.
 *
 * More than one task can be generating the same component — the coordinator starts another when it
 * thinks the first is lost, and a slow first one can still be alive. The two used to race to write the
 * same key, and the loser's write landed after the stage had closed: the stored result was no longer the
 * one the stage aggregated, rendered and promoted. Now the later task sees the result is there and stops.
 */
export const hasRecordedResult = async (
    store: StageArtifactStore.Interface,
    key: string
): Promise<boolean> => {
    const existing = await store.getJson<ComponentResult>(key);
    return existing.isOk() && Boolean(existing.value);
};

export const recordResultOnce = async (
    store: StageArtifactStore.Interface,
    key: string,
    result: ComponentResult
): Promise<Result<"recorded" | "already-recorded", ExtractionError>> => {
    if (await hasRecordedResult(store, key)) {
        return Result.ok("already-recorded");
    }
    const written = await store.putJson(key, result);
    return written.isFail() ? Result.fail(written.error) : Result.ok("recorded");
};
