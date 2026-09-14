import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityWriter, EntryActivityRecorder } from "~/cms/recorder/abstractions.js";
import { EntryActivityRecorder as EntryActivityRecorderImpl } from "~/cms/recorder/EntryActivityRecorder.js";
import { ACTIVITY_LOG_MODEL_ID } from "~/storage/privateModel/ActivityRecordModel.js";
import { WORKFLOW_STATE_MODEL_ID } from "@webiny/api-workflows/domain/workflowState/stateModel.js";

/**
 * The private-model filter is load-bearing for correctness, not only for noise.
 *
 * Two specific things depend on it, and both are the kind of failure that a later "let's capture
 * private models too" change would reintroduce quietly:
 *
 *   - **Recursion.** Activity records are themselves entries in a private CMS model, so recording
 *     them produces a record, whose write produces another. Unbounded, inside an entry save.
 *   - **Double-reporting reviews.** `wbyWorkflowState` is a private model too. Its saves would be
 *     recorded as ordinary entry activity on the workflow-state entry, alongside the review
 *     transitions already captured from APW's own events.
 *
 * These assertions name both models explicitly, imported from the packages that define them, so a
 * rename cannot make the test pass by accident.
 */

const model = (modelId: string, isPrivate: boolean): CmsModel =>
    ({ modelId, isPrivate, fields: [] }) as unknown as CmsModel;

const entry = (): CmsEntry => ({ id: "abc#0001", entryId: "abc", values: {} }) as CmsEntry;

const harness = () => {
    const container = new Container();
    const write = vi.fn(async () => undefined);

    container.registerInstance(ActivityWriter, { write } as unknown as ActivityWriter.Interface);
    container.register(EntryActivityRecorderImpl);

    return { write, recorder: container.resolve(EntryActivityRecorder) };
};

describe("private model filter", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("does not record writes to the activity log's own model", async () => {
        // Without this, one entry save produces an unbounded chain of records.
        const { recorder, write } = harness();

        await recorder.record({
            model: model(ACTIVITY_LOG_MODEL_ID, true),
            entry: entry(),
            action: "entry.create"
        });

        expect(write).not.toHaveBeenCalled();
    });

    it("does not record writes to the workflow state model", async () => {
        // Review transitions are captured from APW's events; recording the state entry's saves as
        // well would report every transition twice, against the wrong target.
        const { recorder, write } = harness();

        await recorder.record({
            model: model(WORKFLOW_STATE_MODEL_ID, true),
            entry: entry(),
            action: "entry.update"
        });

        expect(write).not.toHaveBeenCalled();
    });

    it("does not record any private model", async () => {
        const { recorder, write } = harness();

        for (const modelId of ["wbyRecordLock", "wbySchedule", "wbyAcoFolder", "pbPage"]) {
            await recorder.record({
                model: model(modelId, true),
                entry: entry(),
                action: "entry.update"
            });
        }

        expect(write).not.toHaveBeenCalled();
    });

    it("still records a public model, so the filter is not simply off", async () => {
        const { recorder, write } = harness();

        await recorder.record({
            model: model("article", false),
            entry: entry(),
            action: "entry.update"
        });

        expect(write).toHaveBeenCalledTimes(1);
    });

    it("keeps both model ids resolvable, so the assertions cannot silently stop matching", () => {
        expect(ACTIVITY_LOG_MODEL_ID).toBe("wbyActivityLog");
        expect(WORKFLOW_STATE_MODEL_ID).toBe("wbyWorkflowState");
    });
});
