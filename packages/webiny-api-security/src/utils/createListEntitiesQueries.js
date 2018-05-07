import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { Settings } from "webiny-api";
import _ from "lodash";

export default (app, config, schema) => {
    schema.addType({
        type: new GraphQLObjectType({
            name: "EntityAttributesAttribute",
            fields: {
                name: { type: GraphQLString }
            }
        })
    });

    schema.addType({
        type: new GraphQLObjectType({
            name: "EntityAttributes",
            fields: {
                name: { type: GraphQLString },
                id: { type: GraphQLString },
                attributes: { type: new GraphQLList(schema.getType("EntityAttributesAttribute")) }
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
        resolve() {
            const list = app.services.get("authorization").generateEntitiesList();
            return {
                list: app.services.get("authorization").generateEntitiesList(),
                meta: {
                    totalCount: list.length,
                    totalPages: 1,
                    count: list.length
                }
            };
        }
    };

    schema.addType({
        type: new GraphQLObjectType({
            name: "entityAccessClassType",
            fields: {
                methods: { type: GraphQLJSON },
                attributes: { type: GraphQLJSON }
            }
        })
    });

    schema.query["getEntityAccess"] = {
        description: "Returns an entity.",
        args: {
            id: { type: GraphQLString }
        },
        type: new GraphQLObjectType({
            name: "entityAccess",
            fields: {
                owner: { type: schema.getType("entityAccessClassType") },
                group: { type: schema.getType("entityAccessClassType") },
                other: { type: schema.getType("entityAccessClassType") },
                roles: { type: GraphQLJSON }
            }
        }),
        async resolve(root, args) {
            const classId = args.id;
            const settings = await Settings.findOne({ query: { key: "webiny-api-security" } });
            return _.find(settings.data.entities, { classId }) || {};
        }
    };
};
