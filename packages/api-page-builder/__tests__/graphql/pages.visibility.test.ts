import useGqlHandler from "./useGqlHandler";

describe("page visibility test", () => {
    const {
        createCategory,
        createPage,
        updatePage,
        listPages,
        listPublishedPages,
        publishPage,
        until
    } = useGqlHandler();

    test("changing visiblity of a page should affect results from get and list operations ", async () => {
        const category = await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        }).then(([res]) => res.data.pageBuilder.createCategory.data);

        const p1v1 = await createPage({ category: category.slug }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await until(listPages, ([res]) => {
            const { data } = res.data.pageBuilder.listPages;
            return data.length === 1;
        });

        await updatePage({
            id: p1v1.id,
            data: {
                visibility: {
                    list: {
                        latest: false
                    }
                }
            }
        });

        await until(listPages, ([res]) => {
            const { data } = res.data.pageBuilder.listPages;
            return data.length === 0;
        });

        await until(listPublishedPages, ([res]) => {
            const { data } = res.data.pageBuilder.listPublishedPages;
            return data.length === 0;
        });

        await publishPage({
            id: p1v1.id
        });

        await until(listPublishedPages, ([res]) => {
            const { data } = res.data.pageBuilder.listPublishedPages;
            return data.length === 1;
        });

        const p1v2 = await createPage({ from: p1v1.id }).then(([res]) => {
            return res.data.pageBuilder.createPage.data;
        });

        await until(listPages, ([res]) => {
            const { data } = res.data.pageBuilder.listPages;
            return data.length === 0;
        });

        await updatePage({
            id: p1v2.id,
            data: {
                visibility: {
                    list: {
                        published: false,
                        latest: true
                    }
                }
            }
        });

        await until(listPages, ([res]) => {
            const { data } = res.data.pageBuilder.listPages;
            return data.length === 1;
        });

        await publishPage({
            id: p1v2.id
        });

        await until(listPublishedPages, ([res]) => {
            const { data } = res.data.pageBuilder.listPublishedPages;
            return data.length === 0;
        });
    });
});
