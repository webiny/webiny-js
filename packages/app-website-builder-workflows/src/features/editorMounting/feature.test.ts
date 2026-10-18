import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";
import { WbWorkflowEditorMountingFeature } from "./feature.js";

const contentAdapter = createFakeContentAdapter();

const editorUseCases = createFakeEditorUseCases();

const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const container = new Container();
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    container.registerInstance(WbWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(WbReviewUseCases, reviewUseCases);
    WbWorkflowEditorMountingFeature.register(container);

    return { container, reviewUseCases };
};

describe("WbWorkflowEditorMountingFeature", () => {
    it("resolves the editor use cases, the review use cases and the app adapter for the view", () => {
        const { container, reviewUseCases } = createContainer();

        const {
            useCases,
            reviewUseCases: resolvedReview,
            app
        } = WbWorkflowEditorMountingFeature.resolve(container);

        expect(useCases).toBe(editorUseCases);
        expect(resolvedReview).toBe(reviewUseCases);
        expect(app.appKind).toBe("wb");
        expect(app.contentAdapter).toBe(contentAdapter);
    });

    it("registers the adapter as a singleton", () => {
        const { container } = createContainer();

        const first = container.resolve(WbWorkflowEditorAppAdapter);
        const second = container.resolve(WbWorkflowEditorAppAdapter);

        expect(first).toBe(second);
    });
});
