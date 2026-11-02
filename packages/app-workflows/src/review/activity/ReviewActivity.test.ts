import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ReviewActivity as ReviewActivityToken } from "./abstractions.js";
import { ReviewActivity } from "./ReviewActivity.js";

describe("ReviewActivity", () => {
    let activity: ReviewActivityToken.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(ReviewActivity).inSingletonScope();
        activity = container.resolve(ReviewActivityToken);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("delivers a signal to a listener of its namespace", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });
    });

    it("delivers the review id and the target revision id untouched (R260)", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0002"
        });

        expect(listener).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0002"
        });
    });

    it("does not deliver signals of other namespaces", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        activity.notify({
            namespace: "wb.page",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });

        expect(listener).not.toHaveBeenCalled();
    });

    it("delivers the signals of every subscribed namespace", () => {
        const listener = vi.fn();
        activity.subscribe(["cms.article", "wb.page"], listener);

        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });
        activity.notify({
            namespace: "wb.page",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
        activity.notify({
            namespace: "cms.page",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, {
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });
        expect(listener).toHaveBeenNthCalledWith(2, {
            namespace: "wb.page",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
    });

    it("delivers one signal to every matching listener", () => {
        const first = vi.fn();
        const second = vi.fn();
        activity.subscribe(["cms.article"], first);
        activity.subscribe(["cms.article"], second);

        activity.notify({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it("stops delivering after unsubscribe, and unsubscribe is idempotent", () => {
        const listener = vi.fn();
        const other = vi.fn();
        const unsubscribe = activity.subscribe(["cms.article"], listener);
        activity.subscribe(["cms.article"], other);

        unsubscribe();
        unsubscribe();
        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });

        expect(listener).not.toHaveBeenCalled();
        expect(other).toHaveBeenCalledTimes(1);
    });

    it("keeps delivering to the others when a listener throws, and logs the failure", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const failing = vi.fn(() => {
            throw new Error("Listener failed.");
        });
        const healthy = vi.fn();
        activity.subscribe(["cms.article"], failing);
        activity.subscribe(["cms.article"], healthy);

        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });

        expect(failing).toHaveBeenCalledTimes(1);
        expect(healthy).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalledTimes(1);
    });

    it("copies the namespaces at subscribe time", () => {
        const listener = vi.fn();
        const namespaces = ["cms.article"];
        activity.subscribe(namespaces, listener);

        namespaces.push("wb.page");
        activity.notify({
            namespace: "wb.page",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });

        expect(listener).not.toHaveBeenCalled();
    });

    it("lets a listener unsubscribe itself while a signal is being delivered", () => {
        const later = vi.fn();
        const unsubscribeSelf = activity.subscribe(["cms.article"], () => {
            unsubscribeSelf();
        });
        activity.subscribe(["cms.article"], later);

        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });
        activity.notify({
            namespace: "cms.article",
            source: "own",
            reviewId: null,
            targetRevisionId: null
        });

        expect(later).toHaveBeenCalledTimes(2);
    });
});
