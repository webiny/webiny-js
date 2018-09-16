// @flow

/**
 * Create a field responsible for creation of a new record.
 */

import { GraphQLNonNull, GraphQLObjectType } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { ModelError } from "webiny-model";
import InvalidAttributesError from "./InvalidAttributesError";

import type { Entity } from "webiny-entity";

export default (entityClass: Class<Entity>, entityType: GraphQLObjectType) => {
    return {
        description: `Create a single ${entityClass.classId} entity.`,
        type: entityType,
        args: {
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root: any, args: Object) {
            const entity = new entityClass();
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
