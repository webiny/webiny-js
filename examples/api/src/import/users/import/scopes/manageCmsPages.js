export default {
    listCmsPages: {
        list: {
            id: true,
            slug: true,
            title: true,
            pinned: true,
            status: true,
            category: { id: true, title: true },
            createdBy: true,
            createdOn: true,
            revisions: {
                id: true,
                name: true,
                slug: true,
                title: true,
                active: true,
                content: { id: true, data: true, type: true, origin: true, settings: true },
                savedOn: true,
                createdBy: true,
                createdOn: true
            }
        },
        meta: { count: true, totalCount: true, totalPages: true }
    },
    createCmsPage: { activeRevision: { id: true } },
    deleteCmsPage: true,
    updateCmsPage: { activeRevision: { id: true } }
};
