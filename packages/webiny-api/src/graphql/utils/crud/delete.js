// @flow
import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql";

import type { Entity } from "webiny-entity";
import type Schema from "./../../Schema";

export default (entityClass: Class<Entity>, schema: Schema) => {
    schema.mutation["delete" + entityClass.classId] = {
        description: `Delete a single ${entityClass.classId} entity.`,
        type: GraphQLBoolean,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root, args) {
            const entity = await entityClass.findById(args.id);
            if (!entity) {
                throw Error(`Entity with id "${args.id}" not found.`);
            }

            await entity.delete();
            return true;
        }
    };
};
