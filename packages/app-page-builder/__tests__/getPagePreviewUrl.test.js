import formatPreviewUrl from "@webiny/app-page-builder/src/admin/hooks/usePageBuilderSettings/formatPreviewUrl";

describe("formatPreviewUrl test", () => {
    test(`if no domain, just return path ("id" query param must be present)`, async () => {
        const url = formatPreviewUrl({ page: { id: "xyz", url: "/testers" } });
        expect(url).toBe("/testers?preview=xyz");
    });

    test(`if domain, path must be prefixed with id ("id" query param must be present)`, async () => {
        const url = formatPreviewUrl({
            domain: "http://localhost:3002",
            page: { id: "xyz", url: "/testers" }
        });
        expect(url).toBe("//localhost:3002/testers?preview=xyz");
    });
});
