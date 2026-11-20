import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Webiny } from "@webiny/sdk";
import { CmsSdk } from "./CmsSdk.js";

// Mock the WB SDK's layout delivery: the gateway behind `getLayoutForModel`.
const mockGetLayout = vi.fn();

vi.mock("@webiny/website-builder-sdk", () => ({
    contentSdk: {
        getLayout: (...args: unknown[]) => mockGetLayout(...args)
    }
}));

const articleLayout = { id: "layout-1#0001", elements: {}, bindings: {} };

const createCmsSdk = () => new CmsSdk({} as Webiny);

beforeEach(() => {
    vi.clearAllMocks();
    mockGetLayout.mockResolvedValue(articleLayout);
});

describe("CmsSdk.getLayoutForModel", () => {
    it("returns the published layout the model's `layout` setting names", async () => {
        const result = await createCmsSdk().getLayoutForModel(
            { settings: { previewPath: "/articles/preview", layout: "article" } },
            { language: "hr" }
        );

        expect(mockGetLayout).toHaveBeenCalledWith({ slug: "article", language: "hr" });
        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(articleLayout);
    });

    it("returns null for a model without a `layout` setting, without calling the API", async () => {
        const sdk = createCmsSdk();

        const withoutSettings = await sdk.getLayoutForModel({});
        const withoutLayout = await sdk.getLayoutForModel({
            settings: { previewPath: "/articles/preview" }
        });
        const withEmptyLayout = await sdk.getLayoutForModel({ settings: { layout: "" } });

        expect(withoutSettings.value).toBeNull();
        expect(withoutLayout.value).toBeNull();
        expect(withEmptyLayout.value).toBeNull();
        expect(mockGetLayout).not.toHaveBeenCalled();
    });

    it("returns null when the named layout isn't published", async () => {
        mockGetLayout.mockResolvedValue(null);

        const result = await createCmsSdk().getLayoutForModel({ settings: { layout: "blog" } });

        expect(mockGetLayout).toHaveBeenCalledWith({ slug: "blog", language: undefined });
        expect(result.isOk()).toBe(true);
        expect(result.value).toBeNull();
    });

    it("returns a failed result when loading the layout fails", async () => {
        const sdk = createCmsSdk();
        const model = { settings: { layout: "article" } };

        mockGetLayout.mockRejectedValue(new Error("Network error"));
        const rejected = await sdk.getLayoutForModel(model);

        mockGetLayout.mockImplementation(() => {
            throw new Error("SDK not initialized");
        });
        const thrown = await sdk.getLayoutForModel(model);

        expect(rejected.isFail()).toBe(true);
        expect(rejected.error.message).toBe("Network error");
        expect(thrown.isFail()).toBe(true);
        expect(thrown.error.message).toBe("SDK not initialized");
    });
});
