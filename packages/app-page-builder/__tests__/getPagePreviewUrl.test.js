import getPagePreviewUrl from "@webiny/app-page-builder/src/admin/hooks/usePageBuilderSettings/getPagePreviewUrl";

describe("getPagePreviewUrl test", () => {
    test(`if no "websiteUrl", just return path ("id" query param must be present)`, async () => {
        const url = getPagePreviewUrl({ page: { id: "xyz", path: "/testers" } });
        expect(url).toBe("/testers?preview=xyz");
    });

    test(`if websiteUrl, path must be prefixed with id ("id" query param must be present)`, async () => {
        const url = getPagePreviewUrl({
            websiteUrl: "http://localhost:3002",
            page: { id: "xyz", path: "/testers" }
        });
        expect(url).toBe("//localhost:3002/testers?preview=xyz");
    });
});
