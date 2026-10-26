import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/abstractions.js";
import { CmsEntryFormPresenterReviewDecorator } from "~/presentation/CmsEntryFormPresenterReviewDecorator.js";
import type { EntrySession } from "~/testing/createEntrySession.js";
import { createEntrySession } from "~/testing/createEntrySession.js";
import { CmsEntryContentReloader } from "~/presentation/CmsEntryContentReloader.js";
import { createEntry } from "~/testing/createEntry.js";
import { REVISION_SAVED_ON } from "~/testing/createEntry.js";
import { createFormVm } from "~/testing/createFormVm.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { BOUND_UNPUBLISHED } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";
import { REJECTED } from "~/testing/reviewStates.js";

interface SaveRevisionOptions {
    skipValidation?: boolean;
}

interface BaseState {
    vm: ContentEntryFormPresenter.ViewModel;
    loadRevision: Mock<(id: string) => Promise<void>>;
    saveRevision: Mock<(options?: SaveRevisionOptions) => Promise<boolean>>;
    publishRevision: Mock<() => Promise<boolean>>;
    unpublishRevision: Mock<() => Promise<boolean>>;
    reset: Mock<() => void>;
}

let base: BaseState;

class FakeBasePresenter implements ContentEntryFormPresenter.Interface {
    get vm(): ContentEntryFormPresenter.ViewModel {
        return base.vm;
    }

    loadRevision(id: string): Promise<void> {
        return base.loadRevision(id);
    }

    saveRevision(options?: SaveRevisionOptions): Promise<boolean> {
        return base.saveRevision(options);
    }

    publishRevision(): Promise<boolean> {
        return base.publishRevision();
    }

    unpublishRevision(): Promise<boolean> {
        return base.unpublishRevision();
    }

    deleteEntry(): Promise<boolean> {
        return Promise.resolve(true);
    }

    setFolderId(): void {}

    newEntry(): void {}

    patchEntryMeta(): void {}

    reset(): void {
        base.reset();
    }
}

const BasePresenter = ContentEntryFormPresenter.createImplementation({
    implementation: FakeBasePresenter,
    dependencies: []
});

let fake: EntrySession;
let presenter: ContentEntryFormPresenter.Interface;

function loadedVm(
    overrides: Partial<ContentEntryFormPresenter.ViewModel> = {}
): ContentEntryFormPresenter.ViewModel {
    return createFormVm({ entry: createEntry(), canSave: true, canPublish: true, ...overrides });
}

function createBase(vm: ContentEntryFormPresenter.ViewModel): BaseState {
    return {
        vm,
        loadRevision: vi.fn<(id: string) => Promise<void>>(),
        saveRevision: vi.fn<(options?: SaveRevisionOptions) => Promise<boolean>>(),
        publishRevision: vi.fn<() => Promise<boolean>>(),
        unpublishRevision: vi.fn<() => Promise<boolean>>(),
        reset: vi.fn<() => void>()
    };
}

function resolvePresenter(): ContentEntryFormPresenter.Interface {
    fake = createEntrySession();
    const container = new Container();
    container.registerInstance(CmsEntryReview, fake.session);
    container.register(BasePresenter);
    container.registerDecorator(CmsEntryFormPresenterReviewDecorator);
    return container.resolve(ContentEntryFormPresenter);
}

describe("CmsEntryFormPresenterReviewDecorator", () => {
    beforeEach(() => {
        base = createBase(createFormVm({ entry: null, canSave: false, canPublish: false }));
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm();
        });
        base.saveRevision.mockResolvedValue(true);
        base.publishRevision.mockResolvedValue(true);
        base.unpublishRevision.mockResolvedValue(true);
        presenter = resolvePresenter();
    });

    it("initialises the shared presenter with the revision that was loaded", async () => {
        await presenter.loadRevision("entry-1#0001");

        expect(base.loadRevision).toHaveBeenCalledWith("entry-1#0001");
        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.init).toHaveBeenCalledWith({
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            contentReloader: expect.any(CmsEntryContentReloader),
            targetTitle: "Article: Hello",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
    });

    it("passes the original canSave as canRequest and the published flag", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ canSave: false, entry: createEntry({ status: "published" }) });
        });

        await presenter.loadRevision("entry-1#0001");

        const params = fake.presenter.init.mock.calls[0][0];
        expect(params.canRequest).toBe(false);
        expect(params.isPublished).toBe(true);
        expect(params.isUnpublished).toBe(false);
    });

    it("passes isUnpublished for a revision that was published before and is unpublished now (R226, Q19)", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "unpublished" }) });
        });

        await presenter.loadRevision("entry-1#0001");

        const params = fake.presenter.init.mock.calls[0][0];
        expect(params.isPublished).toBe(false);
        expect(params.isUnpublished).toBe(true);
    });

    it("leaves a singleton model alone", async () => {
        base.vm = createFormVm({ entry: null, canSave: false, model: SINGLETON_MODEL });
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ model: SINGLETON_MODEL });
        });
        fake.setVm(LOADING);

        await presenter.loadRevision("settings#0001");

        expect(fake.presenter.init).not.toHaveBeenCalled();
        expect(presenter.vm.canSave).toBe(true);
        expect(presenter.vm.canPublish).toBe(true);
    });

    it("blocks saving, new revisions and publishing while the revision is loading", async () => {
        let finishLoading = (): void => {};
        base.vm = loadedVm({ canCreateNewRevision: true });
        base.loadRevision.mockImplementation(() => {
            return new Promise<void>(resolve => {
                finishLoading = resolve;
            });
        });

        const loading = presenter.loadRevision("entry-1#0001");

        expect(presenter.vm.canSave).toBe(false);
        expect(presenter.vm.canCreateNewRevision).toBe(false);
        expect(presenter.vm.canPublish).toBe(false);

        finishLoading();
        await loading;
    });

    it.each([
        ["no workflow", NO_WORKFLOW, true, true],
        ["a bound workflow and no review", BOUND_NO_REVIEW, true, false],
        ["an unpublished revision with no review (Q19)", BOUND_UNPUBLISHED, true, true],
        ["loading", LOADING, false, false],
        ["failed", FAILED, false, false],
        ["in review", IN_REVIEW, false, false],
        ["rejected", REJECTED, false, false],
        ["approved", APPROVED, false, true]
    ])("applies the rule for %s", async (_name, review, canSave, canPublish) => {
        base.vm = loadedVm({ canCreateNewRevision: true });
        base.loadRevision.mockResolvedValue(undefined);
        await presenter.loadRevision("entry-1#0001");

        fake.setVm(review);

        expect(presenter.vm.canSave).toBe(canSave);
        expect(presenter.vm.canCreateNewRevision).toBe(canSave);
        expect(presenter.vm.canPublish).toBe(canPublish);
    });

    it("never grants what the original presenter denies", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ canSave: false, canPublish: false });
        });

        await presenter.loadRevision("entry-1#0001");
        fake.setVm(NO_WORKFLOW);

        expect(presenter.vm.canSave).toBe(false);
        expect(presenter.vm.canPublish).toBe(false);
    });

    it("disposes the shared presenter on reset and stops gating", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(LOADING);

        presenter.reset();

        expect(base.reset).toHaveBeenCalledTimes(1);
        expect(fake.presenter.dispose).toHaveBeenCalledTimes(1);
        expect(presenter.vm.canSave).toBe(true);
    });

    it("ignores a load that finished after the editor was reset", async () => {
        let finishLoading = (): void => {};
        base.loadRevision.mockImplementation(() => {
            return new Promise<void>(resolve => {
                finishLoading = resolve;
            });
        });

        const loading = presenter.loadRevision("entry-1#0001");
        presenter.reset();
        base.vm = loadedVm();
        finishLoading();
        await loading;

        expect(fake.presenter.init).not.toHaveBeenCalled();
    });

    it("stops gating and rethrows when the revision load fails", async () => {
        base.vm = loadedVm();
        base.loadRevision.mockRejectedValue(new Error("Load failed."));

        await expect(presenter.loadRevision("entry-1#0001")).rejects.toThrow("Load failed.");

        expect(presenter.vm.canSave).toBe(true);
        expect(presenter.vm.canPublish).toBe(true);
        expect(fake.presenter.init).not.toHaveBeenCalled();
    });

    it("stops gating when the load finishes without an entry", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = createFormVm({ entry: null, canSave: true, canPublish: true });
        });

        await presenter.loadRevision("entry-1#0001");

        expect(presenter.vm.canSave).toBe(true);
        expect(presenter.vm.canPublish).toBe(true);
        expect(fake.presenter.init).not.toHaveBeenCalled();
    });

    it("ignores a load that finished while another revision was loading", async () => {
        let finishFirstLoad = (): void => {};
        let finishSecondLoad = (): void => {};
        base.loadRevision.mockImplementationOnce(() => {
            return new Promise<void>(resolve => {
                finishFirstLoad = resolve;
            });
        });
        base.loadRevision.mockImplementationOnce(() => {
            return new Promise<void>(resolve => {
                finishSecondLoad = () => {
                    base.vm = loadedVm({
                        entry: createEntry({ version: 2 }, { id: "entry-1#0002" })
                    });
                    resolve();
                };
            });
        });

        const firstLoad = presenter.loadRevision("entry-1#0001");
        const secondLoad = presenter.loadRevision("entry-1#0002");
        base.vm = loadedVm();
        finishFirstLoad();
        await firstLoad;
        finishSecondLoad();
        await secondLoad;

        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.init).toHaveBeenCalledWith(
            expect.objectContaining({
                target: { namespace: "cms.article", targetRevisionId: "entry-1#0002" }
            })
        );
    });

    it("does not save or publish while the revision is loading", async () => {
        let finishLoading = (): void => {};
        base.vm = loadedVm();
        base.loadRevision.mockImplementation(() => {
            return new Promise<void>(resolve => {
                finishLoading = resolve;
            });
        });

        fake.setVm(NO_WORKFLOW);

        const loading = presenter.loadRevision("entry-1#0001");
        const saved = await presenter.saveRevision();
        const published = await presenter.publishRevision();
        finishLoading();
        await loading;

        expect(saved).toBe(false);
        expect(published).toBe(false);
        expect(base.saveRevision).not.toHaveBeenCalled();
        expect(base.publishRevision).not.toHaveBeenCalled();
    });

    it("does not track a new entry whose first save failed", async () => {
        presenter.newEntry();
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm();
            return false;
        });

        const saved = await presenter.saveRevision();

        expect(saved).toBe(false);
        expect(fake.presenter.init).not.toHaveBeenCalled();
    });

    it("tracks a new entry's review after its first save", async () => {
        presenter.newEntry();
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm();
            return true;
        });

        const saved = await presenter.saveRevision();

        expect(saved).toBe(true);
        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.init).toHaveBeenCalledWith(
            expect.objectContaining({
                target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" }
            })
        );
    });

    it("stops Save & Publish of a new entry on a bound model before publishing without a review", async () => {
        presenter.newEntry();
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm();
            return true;
        });
        fake.setVm(BOUND_NO_REVIEW);

        await presenter.saveRevision();
        const published = await presenter.publishRevision();

        expect(published).toBe(false);
        expect(base.publishRevision).not.toHaveBeenCalled();
    });

    it("publishes a new entry of a model without a workflow after its first save", async () => {
        presenter.newEntry();
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm();
            return true;
        });
        fake.setVm(NO_WORKFLOW);

        await presenter.saveRevision();
        const published = await presenter.publishRevision();

        expect(published).toBe(true);
        expect(base.publishRevision).toHaveBeenCalledTimes(1);
    });

    it("does not track a new entry of a singleton model after its first save", async () => {
        base.vm = createFormVm({ entry: null, canSave: true, model: SINGLETON_MODEL });
        presenter.newEntry();
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm({ model: SINGLETON_MODEL });
            return true;
        });

        await presenter.saveRevision();

        expect(fake.presenter.init).not.toHaveBeenCalled();
    });

    it("passes a new entry through untouched", () => {
        base.vm = createFormVm({ entry: null, isNewEntry: true, canSave: true, canPublish: false });
        fake.setVm(LOADING);

        presenter.newEntry();

        expect(presenter.vm.canSave).toBe(true);
    });

    it("does not save while the review forbids editing", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(IN_REVIEW);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(false);
        expect(base.saveRevision).not.toHaveBeenCalled();
    });

    it("lets Save & Publish go on for a clean, unlocked approved draft", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(true);
        expect(base.saveRevision).not.toHaveBeenCalled();
    });

    it("does not report a save for a dirty approved draft", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ isDirty: true });
        });
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(false);
        expect(base.saveRevision).not.toHaveBeenCalled();
    });

    it("does not save, and does not offer a new revision, for an approved locked entry", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({
                entry: createEntry({ status: "published", locked: true }),
                canCreateNewRevision: true
            });
        });
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(false);
        expect(base.saveRevision).not.toHaveBeenCalled();
        expect(presenter.vm.canCreateNewRevision).toBe(false);
    });

    it("saves normally when editing is allowed and updates the context", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(NO_WORKFLOW);

        const saved = await presenter.saveRevision({ skipValidation: false });

        expect(saved).toBe(true);
        expect(base.saveRevision).toHaveBeenCalledWith({ skipValidation: false });
        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.setContext).toHaveBeenCalledWith({
            targetTitle: "Article: Hello",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
    });

    it("re-initialises for the new revision a save created", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(NO_WORKFLOW);
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: { ...createEntry(), id: "entry-1#0002" } });
            return true;
        });

        await presenter.saveRevision();

        expect(fake.presenter.init).toHaveBeenCalledTimes(2);
        const params = fake.presenter.init.mock.calls[1][0];
        expect(params.target).toEqual({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0002"
        });
        expect(fake.presenter.setContext).not.toHaveBeenCalled();
    });

    it("gives the new revision a reloader after a save created it", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(NO_WORKFLOW);
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({}, { id: "entry-1#0002" }) });
            return true;
        });

        await presenter.saveRevision();

        const first = fake.presenter.init.mock.calls[0][0].contentReloader;
        const second = fake.presenter.init.mock.calls[1][0].contentReloader;
        expect(second).toBeInstanceOf(CmsEntryContentReloader);
        expect(second).not.toBe(first);
    });

    describe("content reloader", () => {
        const SAVED_LATER = "2026-10-17T11:00:00.000Z";

        async function loadAndGetReloader() {
            await presenter.loadRevision("entry-1#0001");
            const params = fake.presenter.init.mock.calls[0][0];
            const reloader = params.contentReloader;
            if (!reloader) {
                throw new Error("The init params carry no reloader.");
            }
            return reloader;
        }

        it("returns true when the revision timestamps changed and reads the revision again", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionSavedOn: SAVED_LATER })
                });
            });

            const changed = await reloader.reload();

            expect(changed).toBe(true);
            expect(base.loadRevision).toHaveBeenCalledTimes(2);
            expect(base.loadRevision).toHaveBeenLastCalledWith("entry-1#0001");
        });

        it("returns true when only revisionModifiedOn changed", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionModifiedOn: "2026-10-17T11:05:00.000Z" })
                });
            });

            const changed = await reloader.reload();

            expect(changed).toBe(true);
        });

        it("returns false when the timestamps are the same", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionSavedOn: REVISION_SAVED_ON })
                });
            });

            const changed = await reloader.reload();

            expect(changed).toBe(false);
        });

        it("does not reload while the form is dirty", async () => {
            const reloader = await loadAndGetReloader();
            base.vm = loadedVm({ isDirty: true });

            const changed = await reloader.reload();

            expect(changed).toBe(false);
            expect(base.loadRevision).toHaveBeenCalledTimes(1);
        });

        it("never initialises the review presenter again", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionSavedOn: SAVED_LATER })
                });
            });

            await reloader.reload();

            expect(fake.presenter.init).toHaveBeenCalledTimes(1);
            expect(fake.presenter.setContext).not.toHaveBeenCalled();
            expect(fake.presenter.dispose).not.toHaveBeenCalled();
        });
    });

    it("does not publish while the review forbids it", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(IN_REVIEW);

        const published = await presenter.publishRevision();

        expect(published).toBe(false);
        expect(base.publishRevision).not.toHaveBeenCalled();
    });

    it("sets the published flag without reloading after a publish", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);
        base.publishRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "published" }) });
            return true;
        });

        const published = await presenter.publishRevision();

        expect(published).toBe(true);
        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.setContext).toHaveBeenCalledWith({
            targetTitle: "Article: Hello",
            canRequest: true,
            isPublished: true,
            isUnpublished: false
        });
    });

    it("clears the published flag without reloading after an unpublish", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "published" }) });
        });
        await presenter.loadRevision("entry-1#0001");
        base.unpublishRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "unpublished" }) });
            return true;
        });

        await presenter.unpublishRevision();

        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        const context = fake.presenter.setContext.mock.calls[0][0];
        expect(context.isPublished).toBe(false);
        expect(context.isUnpublished).toBe(true);
    });

    it("does not update the review context after an unpublish of an untracked entry", async () => {
        base.vm = loadedVm({ entry: createEntry({ status: "published" }) });
        base.unpublishRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "unpublished" }) });
            return true;
        });

        const unpublished = await presenter.unpublishRevision();

        expect(unpublished).toBe(true);
        expect(fake.presenter.setContext).not.toHaveBeenCalled();
    });
});
