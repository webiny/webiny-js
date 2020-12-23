import useGqlHandler from "./useGqlHandler";

describe("Settings Test", () => {
    const {
        createCategory,
        createPage,
        updateSettings,
        publishPage,
        getPublishedPage,
        deleteElasticSearchIndex
    } = useGqlHandler();

    beforeEach(async () => {
        await deleteElasticSearchIndex();
    });

    test("setting page as homepage", async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        let page = await createPage({ category: "category" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await publishPage({ id: page.id });

        await getPublishedPage({ path: "/" }).then(([res]) =>
            expect(res).toEqual({
                "data": {
                    "pageBuilder": {
                        "getPublishedPage": {
                            "data": null,
                            "error": {
                                "code": "NOT_FOUND",
                                "data": null,
                                "message": "Page not found."
                            }
                        }
                    }
                }
            })
        );

        const [pid] = page.id.split("#");

        await updateSettings({
            data: {
                pages: {
                    home: page.id
                }
            }
        });

        await getPublishedPage({ path: "/" }).then(([res]) =>
            expect(res).toMatchObject({
                "data": {
                    "pageBuilder": {
                        "getPublishedPage": {
                            "data": {
                                "category": {
                                    "slug": "category"
                                },
                                "locked": true,
                                "path": /^some-url\/untitled-/,
                                "status": "published",
                                "title": "Untitled",
                                "version": 1
                            },
                            "error": null
                        }
                    }
                }
            })
        );
    });
});
