import useGqlHandler from "./useGqlHandler";

describe("Page Settings Test", () => {
    const {
        createCategory,
        createPage,
        getPage,
        updatePage,
        deleteElasticSearchIndex
    } = useGqlHandler();

    beforeAll(async () => {
        await deleteElasticSearchIndex();
    });

    test("update settings must work correctly", async () => {
        const category = await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        }).then(([res]) => res.data.pageBuilder.createCategory.data);

        const page = await createPage({ category: category.slug }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await updatePage({
            id: page.id,
            data: {
                settings: {
                    general: {
                        tags: ["a", "b", "c"],
                        layout: "some-layout",
                        image: {
                            id: "settings.general.image.id",
                            src: "settings.general.image.src"
                        }
                    },
                    social: {
                        meta: [
                            { property: "p1", content: "c1" },
                            { property: "p2", content: "c2" },
                            { property: "p3", content: "c3" }
                        ],
                        title: "Social Title",
                        description: "Social Description",
                        image: {
                            id: "settings.social.image.id",
                            src: "settings.social.image.src"
                        }
                    },
                    seo: {
                        title: "SEO Title",
                        description: "SEO Description",
                        meta: [
                            { name: "n1", content: "c1" },
                            { name: "n2", content: "c2" },
                            { name: "n3", content: "c3" }
                        ]
                    }
                }
            }
        });

        await getPage({ id: page.id }).then(([res]) =>
            expect(res.data.pageBuilder.getPage.data.settings).toEqual({
                general: {
                    image: {
                        id: "settings.general.image.id",
                        src: "settings.general.image.src"
                    },
                    layout: "some-layout",
                    tags: ["a", "b", "c"]
                },
                seo: {
                    description: "SEO Description",
                    meta: [
                        {
                            content: "c1",
                            name: "n1"
                        },
                        {
                            content: "c2",
                            name: "n2"
                        },
                        {
                            content: "c3",
                            name: "n3"
                        }
                    ],
                    title: "SEO Title"
                },
                social: {
                    description: "Social Description",
                    image: {
                        id: "settings.social.image.id",
                        src: "settings.social.image.src"
                    },
                    meta: [
                        {
                            content: "c1",
                            property: "p1"
                        },
                        {
                            content: "c2",
                            property: "p2"
                        },
                        {
                            content: "c3",
                            property: "p3"
                        }
                    ],
                    title: "Social Title"
                }
            })
        );

    });
});
