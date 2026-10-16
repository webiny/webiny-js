import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ActiveReviewWarningPresenter as Abstraction } from "./ActiveReviewWarningPresenter.js";
import { ActiveReviewWarningPresenter } from "./ActiveReviewWarningPresenterImpl.js";

const INIT = {
    title: "Review in progress",
    body: "This content has a review in progress. Trashing it cancels the review.",
    reviews: ["Launch article · Step 2 of 3 (Legal)"]
};

const FAILED = "The server did not respond, so nothing was changed. Try again.";

describe("ActiveReviewWarningPresenter", () => {
    let presenter: Abstraction.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(ActiveReviewWarningPresenter);
        presenter = container.resolve(Abstraction);
    });

    it("starts empty", () => {
        expect(presenter.vm).toEqual({
            title: "",
            body: "",
            reviews: [],
            busy: false,
            error: null
        });
    });

    it("init exposes render-ready texts", () => {
        presenter.init(INIT);

        expect(presenter.vm).toEqual({
            title: "Review in progress",
            body: "This content has a review in progress. Trashing it cancels the review.",
            reviews: [{ text: "Launch article · Step 2 of 3 (Legal)" }],
            busy: false,
            error: null
        });
    });

    it("confirm is busy while the dialog's confirm runs and resolves true when it finishes", async () => {
        presenter.init(INIT);
        let release: () => void = () => undefined;
        const onConfirm = () =>
            new Promise<void>(resolve => {
                release = resolve;
            });

        const pending = presenter.confirm(onConfirm);

        expect(presenter.vm.busy).toBe(true);
        release();
        await expect(pending).resolves.toBe(true);
        expect(presenter.vm.busy).toBe(false);
        expect(presenter.vm.error).toBeNull();
    });

    it("confirm ignores a second call while busy", async () => {
        presenter.init(INIT);
        let calls = 0;
        let release: () => void = () => undefined;
        const onConfirm = () => {
            calls += 1;
            return new Promise<void>(resolve => {
                release = resolve;
            });
        };

        const first = presenter.confirm(onConfirm);
        const second = await presenter.confirm(onConfirm);

        expect(second).toBe(false);
        expect(calls).toBe(1);
        release();
        await first;
    });

    it("confirm shows the server message of a rejection that is not classified", async () => {
        presenter.init(INIT);

        const failed = await presenter.confirm(async () => {
            throw new GraphQLOperationError({
                message: "This content is locked by another review.",
                code: ReviewErrorCode.TargetLocked
            });
        });

        expect(failed).toBe(false);
        expect(presenter.vm.error).toBe("This content is locked by another review.");
    });

    it("confirm shows an error and resolves false when the dialog's confirm throws, and can be retried", async () => {
        presenter.init(INIT);

        const failed = await presenter.confirm(async () => {
            throw new Error("boom");
        });

        expect(failed).toBe(false);
        expect(presenter.vm.busy).toBe(false);
        expect(presenter.vm.error).toBe(FAILED);

        const retried = await presenter.confirm(async () => undefined);

        expect(retried).toBe(true);
        expect(presenter.vm.error).toBeNull();
    });

    it("dismiss is allowed unless busy", async () => {
        presenter.init(INIT);
        expect(presenter.dismiss()).toBe(true);

        let release: () => void = () => undefined;
        const pending = presenter.confirm(
            () =>
                new Promise<void>(resolve => {
                    release = resolve;
                })
        );

        expect(presenter.dismiss()).toBe(false);
        release();
        await pending;
        expect(presenter.dismiss()).toBe(true);
    });

    it("dispose resets all state", async () => {
        presenter.init(INIT);
        await presenter.confirm(async () => {
            throw new Error("boom");
        });

        presenter.dispose();

        expect(presenter.vm).toEqual({
            title: "",
            body: "",
            reviews: [],
            busy: false,
            error: null
        });
    });
});
