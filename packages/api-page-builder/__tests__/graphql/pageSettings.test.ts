import useGqlHandler from "./useGqlHandler";
import { PageSettings } from "~/types";

jest.setTimeout(100000);

describe("Page Settings Test", () => {
    const { createCategory, createPage, getPage, updatePage } = useGqlHandler();

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

        const settings: PageSettings = {
            general: {
                snippet: "snippet",
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
        };

        const [updatePageResponse] = await updatePage({
            id: page.id,
            data: {
                settings
            }
        });

        expect(updatePageResponse).toMatchObject({
            data: {
                pageBuilder: {
                    updatePage: {
                        data: {
                            id: page.id,
                            settings
                        },
                        error: null
                    }
                }
            }
        });

        const [getPageResponse] = await getPage({ id: page.id });

        expect(getPageResponse.data.pageBuilder.getPage.data.settings).toEqual({
            general: {
                snippet: "snippet",
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
        });

        const updatedSettings: PageSettings = {
            general: {
                tags: ["a", "b", "c", "d"],
                image: {
                    id: "settings.general.image.id-UPDATED",
                    src: "settings.general.image.src-UPDATED"
                }
            },
            social: {
                meta: [
                    { property: "p1", content: "c1" },
                    { property: "p2", content: "c2" },
                    { property: "p3", content: "c3-UPDATED" }
                ],
                image: {
                    id: "settings.social.image.id-UPDATED",
                    src: "settings.social.image.src-UPDATED"
                }
            },
            seo: {
                title: "SEO Title",
                description: "SEO Description-UPDATED"
            }
        };

        // Note that partial updates don't work correctly because of the way how `populate` works.
        // When sending an object to a `fields` Commodo fields, it wont try to merge it with the
        // current value. Instead, it will just create a new model instance, populate it, and assign that as
        // the new field value. For now, we didn't bother with this behaviour.
        const [updatePageSettingsResult] = await updatePage({
            id: page.id,
            data: {
                settings: updatedSettings
            }
        });

        expect(updatePageSettingsResult).toMatchObject({
            data: {
                pageBuilder: {
                    updatePage: {
                        data: {
                            id: page.id,
                            settings: updatedSettings
                        },
                        error: null
                    }
                }
            }
        });

        const [getPageAfterUpdateResponse] = await getPage({ id: page.id });

        expect(getPageAfterUpdateResponse.data.pageBuilder.getPage.data.settings).toEqual({
            general: {
                snippet: null,
                image: {
                    id: "settings.general.image.id-UPDATED",
                    src: "settings.general.image.src-UPDATED"
                },
                layout: null,
                tags: ["a", "b", "c", "d"]
            },
            seo: {
                description: "SEO Description-UPDATED",
                meta: [],
                title: "SEO Title"
            },
            social: {
                description: null,
                image: {
                    id: "settings.social.image.id-UPDATED",
                    src: "settings.social.image.src-UPDATED"
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
                        content: "c3-UPDATED",
                        property: "p3"
                    }
                ],
                title: null
            }
        });
    });
});
