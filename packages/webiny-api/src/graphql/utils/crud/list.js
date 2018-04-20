import { GraphQLInt } from "graphql";
import GraphQLJSON from "graphql-type-json";
import pluralize from "pluralize";
import parseBoolean from "./parseBoolean";
import { List, SearchInput } from "./types";

export default (entityClass, schema) => {
    const entityType = schema.getType(entityClass.classId);

    schema.query["list" + pluralize.plural(entityClass.classId)] = {
        description: `Get a list of ${entityClass.classId} entities.`,
        type: List(entityType),
        args: {
            page: { type: GraphQLInt },
            perPage: { type: GraphQLInt },
            filter: { type: GraphQLJSON },
            sort: { type: GraphQLJSON },
            search: { type: SearchInput }
        },
        async resolve(root, args) {
            parseBoolean(args);

            const query = { ...args.filter };
            if (args.search && args.search.query) {
                query.$search = {
                    query: args.search.query,
                    columns: args.search.fields,
                    operator: args.search.operator || "or"
                };
            }
            const list = await entityClass.find({
                query,
                page: args.page,
                perPage: args.perPage,
                sort: args.sort
            });
            const meta = list.getParams();
            meta.count = list.length;
            meta.totalCount = list.getMeta().totalCount;
            meta.totalPages = Math.ceil(meta.totalCount / meta.perPage);
            return { list, meta };
        }
    };
};
