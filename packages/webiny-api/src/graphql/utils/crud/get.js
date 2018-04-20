import { GraphQLString, GraphQLNonNull } from "graphql";

export default (entityClass, schema) => {
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
