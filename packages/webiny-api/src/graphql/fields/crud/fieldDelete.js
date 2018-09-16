// @flow

/**
 * Create a field responsible for deletion of a record.
 */

import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql";
import type { Entity } from "webiny-entity";

export default (entityClass: Class<Entity>) => {
    return {
        description: `Delete a single ${entityClass.classId} entity.`,
        type: GraphQLBoolean,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root: any, args: Object) {
            const entity = await entityClass.findById(args.id);
            if (!entity) {
                throw Error(`Entity with id "${args.id}" not found.`);
            }

            await entity.delete();
            return true;
        }
    };
};
