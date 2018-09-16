// @flow

/**
 * Create a field responsible for fetching a list of records.
 */

import { GraphQLInt, GraphQLObjectType } from "graphql";
import GraphQLJSON from "graphql-type-json";
import parseBoolean from "./parseBoolean";
import { List, SearchInput } from "./types";

import type { Entity } from "webiny-entity";

export default (entityClass: Class<Entity>, entityType: GraphQLObjectType) => {
    return {
        description: `Get a list of ${entityClass.classId} entities.`,
        type: List(entityType),
        args: {
            page: { type: GraphQLInt },
            perPage: { type: GraphQLInt },
            where: { type: GraphQLJSON },
            sort: { type: GraphQLJSON },
            search: { type: SearchInput }
        },
        async resolve(root: any, args: Object) {
            parseBoolean(args);

            const query = { ...args.where };
            if (args.search && args.search.query) {
                query.$search = {
                    query: args.search.query,
                    columns: args.search.fields,
                    operator: args.search.operator || "or"
                };
            }

            const data = await entityClass.find({
                query,
                page: args.page,
                perPage: args.perPage,
                sort: args.sort
            });

            const meta = data.getParams();
            meta.count = data.length;
            meta.totalCount = data.getMeta().totalCount;
            meta.totalPages = Math.ceil(meta.totalCount / meta.perPage);
            meta.to = (meta.page - 1) * meta.perPage + meta.count;
            meta.from = meta.to - meta.count + 1;
            meta.nextPage = meta.page < meta.totalPages ? meta.page + 1 : null;
            meta.previousPage = meta.page === 1 ? null : meta.page - 1;

            return { data, meta };
        }
    };
};
