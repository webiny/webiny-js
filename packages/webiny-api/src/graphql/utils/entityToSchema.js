// @flow
import { GraphQLString, GraphQLBoolean, GraphQLInt, GraphQLNonNull } from "graphql";
import GraphQLJSON from "graphql-type-json";
import type { Entity } from "webiny-api";
import pluralize from "pluralize";
import modelToType from "./modelToType";
import parseBoolean from "./parseBoolean";
import { List, SearchInput } from "./types";

export default (entityClass: Class<Entity>, schema: Object) => {
    const name = entityClass.classId;
    const entity = new entityClass();

    const entityType = modelToType(entityClass.classId, entity.getAttributes(), schema.types);

    // Create List and Get queries
    schema.query["get" + name] = {
        description: `Get a single ${entityClass.classId} entity by ID.`,
        type: entityType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve(root, args) {
            return entityClass.findById(args.id);
        }
    };

    schema.query["list" + pluralize.plural(name)] = {
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

    schema.mutation["create" + name] = {
        description: `Create a single ${entityClass.classId} entity.`,
        type: entityType,
        args: {
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args) {
            const entity = new entityClass();
            await entity.populate(args.data).save();
            return entity;
        }
    };

    schema.mutation["update" + name] = {
        description: `Update a single ${entityClass.classId} entity.`,
        type: entityType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) },
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args) {
            const entity = await entityClass.findById(args.id);
            await entity.populate(args.data).save();
            return entity;
        }
    };

    schema.mutation["delete" + name] = {
        description: `Delete a single ${entityClass.classId} entity.`,
        type: GraphQLBoolean,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root, args) {
            const entity = await entityClass.findById(args.id);
            await entity.delete();
            return true;
        }
    };
};
