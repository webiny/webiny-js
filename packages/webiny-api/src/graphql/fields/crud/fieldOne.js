// @flow

/**
 * Create a field responsible for fetching a single record.
 */

import { GraphQLObjectType, GraphQLString } from "graphql";
import GraphQLJSON from "graphql-type-json";
import type { Entity } from "../../../entities";

export default (entityClass: Class<Entity>, type: GraphQLObjectType) => {
    return {
        type,
        args: {
            id: { type: GraphQLString },
            where: { type: GraphQLJSON }, // TODO: create Where type containing scalar attributes
            sort: { type: GraphQLString } // TODO: create Sort type containing scalar attributes
        },
        resolve(root: any, args: Object) {
            if (args.id) {
                return entityClass.findById(args.id);
            }

            return entityClass.findOne({ query: args.where, sort: args.sort });
        }
    };
};
