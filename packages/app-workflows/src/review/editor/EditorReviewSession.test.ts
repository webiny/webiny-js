import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";
import { TargetReviewPresenterFeature } from "~/review/presentation/targetReview/feature.js";
import { EditorReviewSession } from "./EditorReviewSession.js";
import type { IEditorReviewSession } from "./abstractions.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";

/**
 * Two apps, each with its own use cases token and session token, in one container (A83, A77):
 * each subclasses the shared session once, as the app packages do.
 */
const CmsUseCases = createAbstraction<IReviewUseCases>("Test/Cms/ReviewUseCases");
const WbUseCases = createAbstraction<IReviewUseCases>("Test/Wb/ReviewUseCases");
const CmsEntryReview = createAbstraction<IEditorReviewSession>("Test/Cms/EntryReview");
const WbPageReview = createAbstraction<IEditorReviewSession>("Test/Wb/PageReview");

class CmsEntryReviewSessionImpl extends EditorReviewSession implements IEditorReviewSession {}
class WbPageReviewSessionImpl extends EditorReviewSession implements IEditorReviewSession {}

const CmsEntryReviewSession = CmsEntryReview.createImplementation({
    implementation: CmsEntryReviewSessionImpl,
    dependencies: [TargetReviewPresenter, CmsUseCases]
});
const WbPageReviewSession = WbPageReview.createImplementation({
    implementation: WbPageReviewSessionImpl,
    dependencies: [TargetReviewPresenter, WbUseCases]
});

// The bound workflow per namespace: the page namespace has none (R347 routes it by namespace).
const readBoundWorkflow = async (params: GetBoundWorkflowUseCase.Params) => {
    if (params.namespace === "wb.page") {
        return null;
    }
    return createWorkflow();
};

const createContainer = () => {
    const container = new Container();
    const getBoundWorkflow = {
        execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>(readBoundWorkflow)
    };
    const getTargetReview = {
        execute: vi.fn<GetTargetReviewUseCase.Interface["execute"]>().mockResolvedValue(null)
    };
    container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
    container.registerInstance(GetTargetReviewUseCase, getTargetReview);
    container.registerInstance(EventPublisher, { publish: vi.fn().mockResolvedValue(undefined) });
    container.registerInstance(ReviewActivity, createFakeActivity());
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ teams: [] })
    } as unknown as IdentityContext.Interface);
    TargetReviewPresenterFeature.register(container);
    container.register(CmsEntryReviewSession).inSingletonScope();
    container.register(WbPageReviewSession).inSingletonScope();
    return { container, getBoundWorkflow };
};

describe("EditorReviewSession", () => {
    it("holds the presenter and the use cases it was constructed with", () => {
        const useCases = createFakeUseCases();
        const presenter = { vm: {} } as never;

        const session = new EditorReviewSession(presenter, useCases);

        expect(session.presenter).toBe(presenter);
        expect(session.useCases).toBe(useCases);
    });

    it("is a plain class: it carries no DI metadata of its own", () => {
        const container = new Container();
        expect(() => container.resolve(EditorReviewSession as never)).toThrow();
    });

    it("gives two apps two sessions with two presenters and their own use cases (R202, Review Focus 1)", async () => {
        const { container, getBoundWorkflow } = createContainer();
        const cmsUseCases = createFakeUseCases();
        const wbUseCases = createFakeUseCases();
        container.registerInstance(CmsUseCases, cmsUseCases);
        container.registerInstance(WbUseCases, wbUseCases);

        const cms = container.resolve(CmsEntryReview);
        const wb = container.resolve(WbPageReview);

        expect(cms).not.toBe(wb);
        expect(cms.presenter).not.toBe(wb.presenter);
        expect(cms.useCases).toBe(cmsUseCases);
        expect(wb.useCases).toBe(wbUseCases);

        await cms.presenter.init({
            target: TARGET,
            targetTitle: "Spring campaign",
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });
        await wb.presenter.init({
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            targetTitle: "Home",
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });

        expect(cms.presenter.vm.status).toBe("none");
        expect(wb.presenter.vm.status).toBe("noWorkflow");
        expect(getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: "cms.article" });
        expect(getBoundWorkflow.execute).toHaveBeenCalledWith({ namespace: "wb.page" });
        expect(cmsUseCases.getBoundWorkflow).not.toHaveBeenCalled();
        expect(wbUseCases.getBoundWorkflow).not.toHaveBeenCalled();
    });

    it("is a singleton per app: the same session on every resolve", () => {
        const { container } = createContainer();
        container.registerInstance(CmsUseCases, createFakeUseCases());
        container.registerInstance(WbUseCases, createFakeUseCases());

        expect(container.resolve(CmsEntryReview)).toBe(container.resolve(CmsEntryReview));
    });

    it("resets the presenter on dispose so the next editor does not inherit the last one", async () => {
        const { container } = createContainer();
        const useCases = createFakeUseCases();
        container.registerInstance(CmsUseCases, useCases);
        container.registerInstance(WbUseCases, createFakeUseCases());
        const session = container.resolve(CmsEntryReview);
        await session.presenter.init({
            target: TARGET,
            targetTitle: "Spring campaign",
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });

        session.presenter.dispose();

        expect(session.presenter.vm.status).toBe("loading");
        expect(session.presenter.vm.reviewId).toBeNull();
    });
});
