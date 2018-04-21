import { GraphQLString, GraphQLNonNull } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { ModelError } from "webiny-model";
import InvalidAttributesError from "./InvalidAttributesError";

export default (entityClass, schema) => {
    const entityType = schema.getType(entityClass.classId);

    schema.mutation["update" + entityClass.classId] = {
        description: `Update a single ${entityClass.classId} entity.`,
        type: entityType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) },
            data: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args) {
            const entity = await entityClass.findById(args.id);
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
