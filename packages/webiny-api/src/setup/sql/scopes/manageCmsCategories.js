export default {
    createCmsCategory: { id: true, url: true, slug: true, title: true },
    deleteCmsCategory: true,
    listCmsCategories: {
        list: { id: true, url: true, slug: true, title: true, createdOn: true },
        meta: { count: true, totalCount: true, totalPages: true }
    },
    updateCmsCategory: { id: true, url: true, slug: true, title: true }
};
