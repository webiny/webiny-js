import { Group } from "webiny-api";

export default async () => {
    const group = new Group();
    group.populate({
        name: "CMS",
        description: "Manage CMS pages, categories, redirects etc.",
        slug: "cms",
        permissions: {
            api: {
                getCmsPage: true,
                getCmsWidget: true,
                listCmsPages: {
                    list: {
                        id: true,
                        slug: true,
                        title: true,
                        pinned: true,
                        status: true,
                        category: { id: true, slug: true, title: true },
                        createdBy: true,
                        createdOn: true,
                        revisions: {
                            id: true,
                            name: true,
                            slug: true,
                            title: true,
                            active: true,
                            content: {
                                id: true,
                                data: true,
                                type: true,
                                origin: true,
                                settings: true
                            },
                            savedOn: true,
                            createdBy: true,
                            createdOn: true,
                            updatedOn: true,
                            createdByClassId: true
                        },
                        createdByClassId: true
                    },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                getCmsCategory: true,
                getCmsRevision: true,
                listCmsWidgets: {
                    list: { id: true, title: true },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                listCmsRevisions: {
                    list: { id: true, slug: true, title: true },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                listCmsCategories: {
                    list: { id: true, slug: true, title: true },
                    meta: { count: true, totalCount: true, totalPages: true }
                }
            },
            entities: {
                CmsPage: { operations: { read: true, create: true, delete: true, update: true } },
                CmsWidget: { operations: { read: true, create: true, delete: true, update: true } },
                CmsCategory: {
                    operations: { read: true, create: true, delete: true, update: true }
                },
                CmsRevision: {
                    operations: { read: true, create: true, delete: true, update: true }
                }
            }
        }
    });

    await group.save();
};
