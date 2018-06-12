import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLBoolean } from "graphql";
import GraphQLJSON from "graphql-type-json";

export default (api, config, schema) => {
    schema.addType({
        type: new GraphQLObjectType({
            name: "EntityAttributesAttribute",
            fields: {
                name: { type: GraphQLString },
                protected: { type: GraphQLBoolean }
            }
        })
    });

    schema.addType({
        type: new GraphQLObjectType({
            name: "EntityAttributes",
            fields: {
                name: { type: GraphQLString },
                classId: { type: GraphQLString },
                attributes: { type: new GraphQLList(schema.getType("EntityAttributesAttribute")) },
                permissions: { type: GraphQLJSON }
            }
        })
    });

    schema.query["listEntities"] = {
        description: "Returns a list of all registered entities and its attributes.",
        type: new GraphQLObjectType({
            name: "entitiesListType",
            fields: {
                list: { type: new GraphQLList(schema.getType("EntityAttributes")) },
                meta: {
                    type: new GraphQLObjectType({
                        name: "listMeta",
                        fields: {
                            count: { type: GraphQLInt },
                            totalCount: { type: GraphQLInt },
                            totalPages: { type: GraphQLInt }
                        }
                    })
                }
            }
        }),
        async resolve() {
            const list = api.entities.getEntityClasses().map(entityClass => {
                return entityClass.describe();
            });

            return {
                list,
                meta: {
                    totalCount: list.length,
                    totalPages: 1,
                    count: list.length
                }
            };
        }
    };
};
