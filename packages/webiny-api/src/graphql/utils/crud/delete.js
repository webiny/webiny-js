import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql";

export default (entityClass, schema) => {
    schema.mutation["delete" + entityClass.classId] = {
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
