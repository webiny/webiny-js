// @flow
import type { Entity, EntityCollection } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);

    const { page = 1, perPage = 10, sort = null, search = null } = args;
    const variables = [];

    let where = "WHERE 1=1";
    if (search) {
        where += ` AND MATCH (title) AGAINST (? IN BOOLEAN MODE)`;
        variables.push(search);
    }

    let orderBy = "";
    if (sort) {
        orderBy =
            "ORDER BY " +
            Object.keys(sort)
                .map(key => `${key} ${sort[key] > 0 ? "ASC" : "DESC"}`)
                .join(", ");
    }

    const sql = {
        query: `SELECT SQL_CALC_FOUND_ROWS * FROM (
          SELECT * FROM ${
              entityClass.storageClassId
          } WHERE deleted = 0 ORDER BY published DESC, version DESC
        ) as p ${where} GROUP BY parent ${orderBy} LIMIT ? OFFSET ?`,
        values: [...variables, perPage, (page - 1) * perPage]
    };

    const pages: EntityCollection<Entity> = await entityClass.find({ sql });

    const meta: Object = {
        page,
        perPage,
        count: pages.length,
        totalCount: pages.getMeta().totalCount
    };

    meta.totalPages = Math.ceil(meta.totalCount / meta.perPage);
    meta.to = (meta.page - 1) * meta.perPage + meta.count;
    meta.from = meta.to - meta.count + 1;
    meta.nextPage = meta.page < meta.totalPages ? meta.page + 1 : null;
    meta.previousPage = meta.page === 1 ? null : meta.page - 1;

    return new ListResponse(pages, meta);
};
