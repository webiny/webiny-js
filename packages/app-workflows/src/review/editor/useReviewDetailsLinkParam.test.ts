import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReviewDetailsLinkParam } from "./useReviewDetailsLinkParam.js";

type RouteParams = Record<string, unknown>;

const route = vi.hoisted(() => {
    return {
        params: {} as Record<string, unknown>,
        replaceRouteParams: vi.fn()
    };
});

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return {
        ...actual,
        useRoute: () => ({
            route: { name: "WebsiteBuilder/Pages/Editor", params: route.params },
            replaceRouteParams: route.replaceRouteParams
        })
    };
});

describe("useReviewDetailsLinkParam (B2 design 9)", () => {
    beforeEach(() => {
        route.params = {};
        route.replaceRouteParams.mockReset();
    });

    it("reads the review id from the location", () => {
        route.params = { id: "page-1#0001", tenantId: "root", reviewId: "review-1" };

        const { result } = renderHook(() => useReviewDetailsLinkParam());

        expect(result.current.reviewId).toBe("review-1");
    });

    it.each([{}, { reviewId: "" }, { reviewId: "  " }, { reviewId: ["a", "b"] }])(
        "has no review id for %j",
        params => {
            route.params = params;

            const { result } = renderHook(() => useReviewDetailsLinkParam());

            expect(result.current.reviewId).toBeNull();
        }
    );

    it("reads the review id once: a later location change does not change it", () => {
        route.params = { reviewId: "review-1" };
        const { result, rerender } = renderHook(() => useReviewDetailsLinkParam());

        route.params = { reviewId: "review-2" };
        rerender();

        expect(result.current.reviewId).toBe("review-1");
    });

    it("removes only the review id, with a replace, and keeps the other params", () => {
        route.params = { id: "page-1#0001", tenantId: "root", reviewId: "review-1" };
        const { result } = renderHook(() => useReviewDetailsLinkParam());

        result.current.clear();

        expect(route.replaceRouteParams).toHaveBeenCalledTimes(1);
        const [update] = route.replaceRouteParams.mock.calls[0] as [
            (params: RouteParams) => RouteParams
        ];
        expect(update({ ...route.params })).toEqual({ id: "page-1#0001", tenantId: "root" });
    });

    it("does not touch the location when the param is gone", () => {
        route.params = { reviewId: "review-1" };
        const { result, rerender } = renderHook(() => useReviewDetailsLinkParam());

        route.params = { id: "page-1#0001" };
        rerender();
        result.current.clear();

        expect(route.replaceRouteParams).not.toHaveBeenCalled();
    });
});
