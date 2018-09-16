// @flow

/**
 * Create a field responsible for update of a single record.
 */

import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { ModelError } from "webiny-model";
import InvalidAttributesError from "./InvalidAttributesError";
import type { Entity } from "webiny-entity";

// TODO:
// import { createResponseType, responseResolver } from "./responseResolver";

export default (entityClass: Class<Entity>, entityType: GraphQLObjectType) => {
    return {
        description: `Update a single ${entityClass.classId} entity.`,
        // type: createResponseType(entityType),
        type: entityType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) },
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        resolve: async (root: any, args: Object) => {
            const entity = await entityClass.findById(args.id);
            if (!entity) {
                throw Error(`Entity with id "${args.id}" not found.`);
            }

            try {
                await entity.populate(args.data).save();
            } catch (e) {
                if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
                    throw InvalidAttributesError.from(e);
                }
                throw e;
            }
            return entity;
        }
    };
};
