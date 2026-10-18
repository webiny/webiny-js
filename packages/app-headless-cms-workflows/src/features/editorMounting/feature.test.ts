import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflowEditorMountingFeature } from "./feature.js";

const contentAdapter = createFakeContentAdapter();

const editorUseCases = createFakeEditorUseCases();

const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const container = new Container();
    container.registerInstance(ModelsCache, new ListCache<CmsModel>("modelId"));
    container.registerInstance(ListModelsUseCase, { execute: vi.fn().mockResolvedValue([]) });
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    container.registerInstance(CmsWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(CmsReviewUseCases, reviewUseCases);
    CmsWorkflowEditorMountingFeature.register(container);

    return { container, reviewUseCases };
};

describe("CmsWorkflowEditorMountingFeature", () => {
    it("resolves the editor use cases, the review use cases and the app adapter for the view", () => {
        const { container, reviewUseCases } = createContainer();

        const {
            useCases,
            reviewUseCases: resolvedReview,
            app
        } = CmsWorkflowEditorMountingFeature.resolve(container);

        expect(useCases).toBe(editorUseCases);
        expect(resolvedReview).toBe(reviewUseCases);
        expect(app.appKind).toBe("cms");
        expect(app.contentAdapter).toBe(contentAdapter);
    });

    it("registers the adapter as a singleton", () => {
        const { container } = createContainer();

        const first = container.resolve(CmsWorkflowEditorAppAdapter);
        const second = container.resolve(CmsWorkflowEditorAppAdapter);

        expect(first).toBe(second);
    });
});
