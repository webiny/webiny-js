import { ListMeta } from "../../../types";

type Params = {
    page: number;
    limit: number;
    totalCount: number;
};

export default (params?: Params): ListMeta => {
    const meta: ListMeta = {
        page: 0,
        limit: 0,
        totalCount: 0,
        totalPages: 0,
        from: 0,
        to: 0,
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
