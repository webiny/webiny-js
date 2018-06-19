// @flow
import { GraphQLString, GraphQLNonNull } from "graphql";

import type { Entity } from "webiny-entity";
import type Schema from "./../../Schema";

export default (entityClass: Class<Entity>, schema: Schema) => {
    const entityType = schema.getType(entityClass.classId);

    schema.query["get" + entityClass.classId] = {
        description: `Get a single ${entityClass.classId} entity by ID.`,
        type: entityType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve(root, args) {
            return entityClass.findById(args.id);
        }
    };
};
