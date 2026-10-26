import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { createEntry } from "~/testing/createEntry.js";
import { createFormVm } from "~/testing/createFormVm.js";
import { CmsEntryContentReloader } from "./CmsEntryContentReloader.js";

const SAVED_LATER = "2026-10-17T11:00:00.000Z";
const MODIFIED_LATER = "2026-10-17T11:05:00.000Z";

interface FormState {
    vm: ContentEntryFormPresenter.ViewModel;
}

describe("CmsEntryContentReloader", () => {
    let state: FormState;
    let loadRevision: ReturnType<typeof vi.fn>;
    let reloader: CmsEntryContentReloader;

    beforeEach(() => {
        state = { vm: createFormVm({ entry: createEntry(), isDirty: false }) };
        loadRevision = vi.fn(async (_id: string) => undefined);
        const form = {
            get vm() {
                return state.vm;
            },
            loadRevision
        } as unknown as ContentEntryFormPresenter.Interface;
        reloader = new CmsEntryContentReloader(form, "entry-1#0001");
    });

    it("reads the revision again and returns true when revisionSavedOn changed", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({
                entry: createEntry({}, { revisionSavedOn: SAVED_LATER })
            });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(true);
        expect(loadRevision).toHaveBeenCalledTimes(1);
        expect(loadRevision).toHaveBeenCalledWith("entry-1#0001");
    });

    it("returns true when only revisionModifiedOn changed", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({
                entry: createEntry({}, { revisionModifiedOn: MODIFIED_LATER })
            });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(true);
    });

    it("returns false when both timestamps are the same after the read", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({ entry: createEntry() });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).toHaveBeenCalledTimes(1);
    });

    it("does not read while the form is dirty", async () => {
        state.vm = createFormVm({ entry: createEntry(), isDirty: true });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).not.toHaveBeenCalled();
    });

    it("does not read when no entry is loaded", async () => {
        state.vm = createFormVm({ entry: null });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).not.toHaveBeenCalled();
    });

    it("does not read when the editor moved to another revision", async () => {
        state.vm = createFormVm({ entry: createEntry({}, { id: "entry-1#0002" }) });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).not.toHaveBeenCalled();
    });

    it("returns false when the read left no entry", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({ entry: null });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
    });

    it("returns false when the read left another revision loaded", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({
                entry: createEntry({}, { id: "entry-1#0002", revisionSavedOn: SAVED_LATER })
            });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).toHaveBeenCalledTimes(1);
    });

    it("lets a failed read reject so the presenter can ignore it", async () => {
        const failure = new Error("Network down");
        loadRevision.mockRejectedValue(failure);

        const error = await reloader.reload().catch(e => e);

        expect(error).toBe(failure);
    });
});
