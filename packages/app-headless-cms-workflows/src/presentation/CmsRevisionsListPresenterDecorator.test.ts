import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import type { CmsContentEntryRevision } from "@webiny/app-headless-cms/types.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { RevisionsListPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/CmsEntryReview.js";
import { createEntrySession } from "~/testing/createEntrySession.js";
import { MODEL } from "~/testing/models.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";
import { CmsRevisionsListPresenterDecorator } from "./CmsRevisionsListPresenterDecorator.js";

const DRAFT = { id: "entry-1#0002", meta: { status: "draft" } } as CmsContentEntryRevision;
const PUBLISHED = { id: "entry-1#0001", meta: { status: "published" } } as CmsContentEntryRevision;

const init = vi.fn(async () => undefined);

class BaseRevisionsListPresenter implements RevisionsListPresenter.Interface {
    public get vm(): RevisionsListPresenter.ViewModel {
        return {
            loading: false,
            revisions: [DRAFT, PUBLISHED],
            items: [
                { revision: DRAFT, canPublish: true, canUnpublish: false },
                { revision: PUBLISHED, canPublish: false, canUnpublish: true }
            ],
            visible: true
        };
    }

    public init = init;
    public show = vi.fn();
    public hide = vi.fn();
    public createRevision = vi.fn(async () => null);
    public publishRevision = vi.fn(async () => true);
    public unpublishRevision = vi.fn(async () => true);
    public updateRevisionNote = vi.fn(async () => true);
    public deleteRevision = vi.fn(async () => true);
    public dispose = vi.fn();
}

const BasePresenter = RevisionsListPresenter.createImplementation({
    implementation: BaseRevisionsListPresenter,
    dependencies: []
});

const resolvePresenter = (model: CmsModel, review: Parameters<typeof createEntrySession>[0]) => {
    const fake = createEntrySession(review);
    const container = new Container();
    container.registerInstance(CmsEntryReview, fake.session);
    container.registerInstance(CmsModelContext, { getModel: () => model, setModel: vi.fn() });
    container.register(BasePresenter).inSingletonScope();
    container.registerDecorator(CmsRevisionsListPresenterDecorator);
    return { ...fake, presenter: container.resolve(RevisionsListPresenter) };
};

const flags = (presenter: RevisionsListPresenter.Interface) => {
    return presenter.vm.items.map(item => [item.canPublish, item.canUnpublish]);
};

describe("CmsRevisionsListPresenterDecorator", () => {
    it("keeps Publish and Unpublish on a model without a workflow", () => {
        const { presenter } = resolvePresenter(MODEL, NO_WORKFLOW);

        expect(flags(presenter)).toEqual([
            [true, false],
            [false, true]
        ]);
    });

    it.each([
        ["bound without a review", BOUND_NO_REVIEW],
        ["in review", IN_REVIEW],
        ["loading", LOADING],
        ["failed", FAILED]
    ])("hides Publish and Unpublish on a workflow model (%s)", (_name, review) => {
        const { presenter } = resolvePresenter(MODEL, review);

        expect(flags(presenter)).toEqual([
            [false, false],
            [false, false]
        ]);
        expect(presenter.vm.revisions).toEqual([DRAFT, PUBLISHED]);
    });

    it("leaves a singleton model alone, it is never bound to a workflow", () => {
        const { presenter } = resolvePresenter(SINGLETON_MODEL, LOADING);

        expect(flags(presenter)).toEqual([
            [true, false],
            [false, true]
        ]);
    });

    it("follows the review state as it loads", () => {
        const { presenter, setVm } = resolvePresenter(MODEL, LOADING);
        expect(presenter.vm.items[0].canPublish).toBe(false);

        setVm(NO_WORKFLOW);

        expect(presenter.vm.items[0].canPublish).toBe(true);
    });

    it("passes the actions to the base presenter", async () => {
        const { presenter } = resolvePresenter(MODEL, NO_WORKFLOW);

        await presenter.init("entry-1");

        expect(init).toHaveBeenCalledWith("entry-1");
    });
});
