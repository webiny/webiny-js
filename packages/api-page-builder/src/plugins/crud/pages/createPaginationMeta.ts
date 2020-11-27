
type PaginationMeta = {
    page: number;
    limit: number;
    totalCount: number;
    totalPages?: number;
    from?: number;
    to?: number;
    nextPage?: number;
    previousPage?: number;
};

type Params = {
    page: number;
    limit: number;
    totalCount: number;
};

const createPaginationMeta = (params?: Params): PaginationMeta => {
    const meta: PaginationMeta = {
        page: 0,
        limit: 0,
        totalCount: 0,
        totalPages: null,
        from: null,
        to: null,
        nextPage: null,
        previousPage: null,
        ...params
    };

    if (meta.page && meta.limit) {
        meta.totalPages = Math.ceil(meta.totalCount / meta.limit);

        if (meta.totalCount) {
            meta.from = 1 + meta.limit * (meta.page - 1);
        } else {
            meta.from = 0;
        }

        meta.to = meta.limit * meta.page;
        if (meta.to > meta.totalCount) {
            meta.to = meta.totalCount;
        }

        meta.nextPage = meta.page < meta.totalPages ? meta.page + 1 : null;
        meta.previousPage = meta.page === 1 ? null : meta.page - 1;
    }

    return meta;
};
