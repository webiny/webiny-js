import getPagePreviewUrl from "webiny-app-cms/src/admin/components/withCmsSettings/getPagePreviewUrl";

describe("getPagePreviewUrl test", () => {
    test(`if no domain, just return path ("id" query param must be present)`, async () => {
        const url = getPagePreviewUrl({ page: { id: "xyz", url: "/testers" } });
        expect(url).toBe("/testers?preview=xyz");
    });

    test(`if domain, path must be prefixed with id ("id" query param must be present)`, async () => {
        const url = getPagePreviewUrl({
            domain: "http://localhost:3002",
            page: { id: "xyz", url: "/testers" }
        });
        expect(url).toBe("//localhost:3002/testers?preview=xyz");
    });
});
