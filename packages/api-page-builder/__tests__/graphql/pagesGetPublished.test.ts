import useGqlHandler from "./useGqlHandler";

import { Page } from "~/types";

jest.setTimeout(100000);

describe("getting published pages", () => {
    const handler = useGqlHandler();

    const {
        createCategory,
        createPage,
        publishPage,
        listPublishedPages,
        getPublishedPage,
        updatePage,
        until
    } = handler;

    const createInitialData = async () => {
        const pages: Page[] = [];
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["a", "z", "b", "x", "c"];
        for (const letter of letters) {
            const [response] = await createPage({ category: "category" });
            const page = response.data.pageBuilder.createPage.data;
            if (!page) {
                throw new Error(`Missing page data: ${letter}`);
            }

            const title = `page-${letter}`;
            const path = `/path-${letter}`;

            const [updateResponse] = await updatePage({
                id: page.id,
                data: {
                    title,
                    path
                }
            });
            const updatedPage = updateResponse.data.pageBuilder.updatePage.data;
            if (!updatedPage) {
                throw new Error(`Missing updated page data: ${letter}`);
            }

            pages.push(updatedPage);

            // Publish pages.
            if (["a", "b", "c"].includes(letter)) {
                await publishPage({
                    id: updatedPage.id
                });
            }
        }

        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]) => {
                const data: any[] = res.data.pageBuilder.listPublishedPages.data;
                const published = data.every(p => p.status === "published");
                return published && data[0].title === "page-c";
            },
            {
                name: "list published pages after update and publish"
            }
        );

        return pages;
    };

    test("getting published pages by full ID", async () => {
        const initialPages = await createInitialData();

        const [response] = await getPublishedPage({ id: initialPages[0].id });

        expect(response.data.pageBuilder.getPublishedPage.data.id).toBe(initialPages[0].id);
    });

    test("getting published pages by page unique ID (ID without version)", async () => {
        const initialPages = await createInitialData();

        const [pageUniqueId] = initialPages[0].id.split("#");
        const [response] = await getPublishedPage({ id: pageUniqueId });

        expect(response.data.pageBuilder.getPublishedPage.data.id).toBe(initialPages[0].id);
    });

    test("getting published pages by URL", async () => {
        const initialPages = await createInitialData();

        const [pathAResponse] = await getPublishedPage({ path: "/path-a" });
        expect(pathAResponse.data.pageBuilder.getPublishedPage.data.id).toBe(initialPages[0].id);

        const [pathCResponse] = await getPublishedPage({ path: "/path-c" });
        expect(pathCResponse.data.pageBuilder.getPublishedPage.data.id).toBe(initialPages[4].id);
    });

    test("should be able to get an unpublished page by ID, with preview flag set to true", async () => {
        const initialPages = await createInitialData();
        // This should fail, we must only be able to get a page for preview if exact ID was specified.
        const [pathZResponse] = await getPublishedPage({ path: "/path-z", preview: true });

        expect(pathZResponse.data.pageBuilder.getPublishedPage).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                data: null,
                message: "Page not found."
            }
        });

        // This should work.
        const [id1Response] = await getPublishedPage({
            id: initialPages[1].id,
            preview: true
        });

        expect(id1Response.data.pageBuilder.getPublishedPage.data.id).toBe(initialPages[1].id);
        expect(id1Response.data.pageBuilder.getPublishedPage.data.status).toBe("draft");
    });
});
