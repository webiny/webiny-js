import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { RevisionListPresenter } from "@webiny/app-website-builder/presentation/pages/RevisionList/abstractions.js";
import type { IRevisionListVm } from "@webiny/app-website-builder/presentation/pages/RevisionList/abstractions.js";
import type { PageRevision } from "@webiny/app-website-builder/domain/PageRevision/index.js";
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { RevisionListPresenterDecorator } from "./RevisionListPresenterDecorator.js";

const initCalls: RevisionListPresenter.Init[] = [];

class FakeRevisionListPresenter implements RevisionListPresenter.Interface {
    public get vm(): IRevisionListVm {
        return {
            revisions: [
                {
                    revision: { id: "page-1#0001" } as PageRevision,
                    canCreateFrom: true,
                    canEdit: true,
                    canPublish: true,
                    canUnpublish: false,
                    canDelete: true
                },
                {
                    revision: { id: "page-1#0002" } as PageRevision,
                    canCreateFrom: true,
                    canEdit: true,
                    canPublish: false,
                    canUnpublish: true,
                    canDelete: true
                }
            ],
            isLoading: false,
            isMutating: false,
            isEmpty: false
        };
    }

    public init(params: RevisionListPresenter.Init): void {
        initCalls.push(params);
    }
}

const FakePresenter = RevisionListPresenter.createImplementation({
    implementation: FakeRevisionListPresenter,
    dependencies: []
});

const createPresenter = (kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    container.register(FakePresenter).inSingletonScope();
    container.registerDecorator(RevisionListPresenterDecorator);
    return { ...handle, presenter: container.resolve(RevisionListPresenter) };
};

describe("RevisionListPresenterDecorator", () => {
    it("keeps the base Publish when the page's namespace has no workflow", () => {
        const { presenter } = createPresenter("noWorkflow");

        expect(presenter.vm.revisions.map(item => item.canPublish)).toEqual([true, false]);
    });

    const hidden: FakeReviewKind[] = ["loading", "failed", "none", "inProgress", "approved"];
    it.each(hidden)("hides Publish while the review state is %s", kind => {
        const { presenter } = createPresenter(kind);

        expect(presenter.vm.revisions.map(item => item.canPublish)).toEqual([false, false]);
        expect(presenter.vm.revisions.map(item => item.canUnpublish)).toEqual([false, true]);
    });

    it("follows the review state as it changes", () => {
        const { presenter, setKind } = createPresenter("loading");
        expect(presenter.vm.revisions[0].canPublish).toBe(false);

        setKind("noWorkflow");

        expect(presenter.vm.revisions[0].canPublish).toBe(true);
    });

    it("passes init to the base presenter", () => {
        const { presenter } = createPresenter("noWorkflow");

        presenter.init({ entryId: "page-1" });

        expect(initCalls).toContainEqual({ entryId: "page-1" });
    });
});
