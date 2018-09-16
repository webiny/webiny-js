// @flow
import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLID } from "graphql";
import GraphQLJSON from "graphql-type-json";
import ApiToken from "./ApiToken.entity";
import { ModelError } from "webiny-model";
import InvalidAttributesError from "./../../graphql/fields/crud/InvalidAttributesError";
import { crudFields, createField, schema } from "../../graphql";

export const ApiTokenType = new GraphQLObjectType({
    name: ApiToken.classId,
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        permissions: { type: GraphQLJSON },
        slug: { type: GraphQLString },
        createdOn: { type: GraphQLString },
        description: { type: GraphQLString },
        token: { type: GraphQLString }
    })
});

export const ApiTokenQueryType = new GraphQLObjectType({
    name: "SecurityApiTokens",
    fields: () => ({
        ...crudFields(ApiToken, schema.getType(ApiTokenType.name)),
        create: {
            description: `Create a single ${ApiToken.classId} entity.`,
            type: ApiTokenType,
            args: {
                data: { type: new GraphQLNonNull(GraphQLJSON) }
            },
            async resolve(root, args) {
                const entity = new ApiToken();
                try {
                    await entity.populate(args.data).save();
                    await entity.activate();
                    await entity.save();
                } catch (e) {
                    if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
                        throw InvalidAttributesError.from(e);
                    }
                    throw e;
                }
                return entity;
            }
        }
    })
});

export const ApiTokenQueryField = () => createField(schema.getType(ApiTokenQueryType.name));
