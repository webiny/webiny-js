import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { CmsEntryReviewFeature } from "~/features/editorReview/feature.js";

function createContainer() {
    const container = new Container();
    const presenter = createFakePresenter();
    container.registerInstance(TargetReviewPresenter, presenter);
    CmsEntryReviewFeature.register(container);

    return { container, presenter };
}

describe("CmsEntryReviewFeature", () => {
    it("builds the session from the shared presenter alone (R352)", () => {
        const { container, presenter } = createContainer();

        const { session } = CmsEntryReviewFeature.resolve(container);

        expect(session.presenter).toBe(presenter);
        expect(session).not.toHaveProperty("useCases");
    });

    it("registers a subclass of the shared session, not the shared class itself", () => {
        const { container } = createContainer();

        const { session } = CmsEntryReviewFeature.resolve(container);

        expect(session.constructor.name).toBe("CmsEntryReviewSessionImpl");
    });

    it("keeps one session per container (one editor is open at a time)", () => {
        const { container } = createContainer();

        const first = CmsEntryReviewFeature.resolve(container).session;
        const second = CmsEntryReviewFeature.resolve(container).session;

        expect(first).toBe(second);
    });

    it("gives two containers two independent sessions", () => {
        const one = createContainer();
        const two = createContainer();

        const first = CmsEntryReviewFeature.resolve(one.container).session;
        const second = CmsEntryReviewFeature.resolve(two.container).session;

        expect(first.presenter).toBe(one.presenter);
        expect(second.presenter).toBe(two.presenter);
    });
});
