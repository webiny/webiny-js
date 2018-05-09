import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLBoolean,
    GraphQLNonNull,
    GraphQLID
} from "graphql";
import GraphQLJSON from "graphql-type-json";
import { SecuritySettings } from "webiny-api-security";
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
            const list = app.services.get("authentication").generateEntitiesList();
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

    schema.addType({
        type: new GraphQLObjectType({
            name: "entityAccessClassType",
            fields: {
                operations: {
                    type: new GraphQLObjectType({
                        name: "entityAccessClassOperationsType",
                        fields: {
                            create: { type: GraphQLBoolean },
                            delete: { type: GraphQLBoolean },
                            update: { type: GraphQLBoolean },
                            read: { type: GraphQLBoolean }
                        }
                    })
                },
                methods: { type: GraphQLJSON },
                attributes: { type: GraphQLJSON }
            }
        })
    });
    schema.addType({
        type: new GraphQLObjectType({
            name: "entityPermissions",
            fields: {
                id: { type: GraphQLID },
                owner: { type: GraphQLJSON },
                group: { type: GraphQLJSON },
                other: { type: GraphQLJSON }
            }
        })
    });

    schema.query["getEntityPermission"] = {
        description: "Returns an entity.",
        type: schema.getType("entityPermissions"),
        args: {
            id: { type: GraphQLID }
        },
        async resolve(root, args) {
            const settings = await SecuritySettings.load();
            return await settings.get(`data.entities.${args.id}`);
        }
    };

    schema.mutation["toggleEntityPermission"] = {
        description: "Toggles entity permissions",
        type: schema.getType("entityPermissions"),
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) },
            class: { type: new GraphQLNonNull(GraphQLString) },
            permission: { type: new GraphQLNonNull(GraphQLJSON) }
        },
        async resolve(root, args) {
            const { id, permission } = args;
            const settings = await SecuritySettings.load();

            const settingsData = _.cloneDeep(settings.data);
            let path = `entities.${id}.${args.class}.${permission.type}.${permission.name}`;

            if (_.get(settingsData, path)) {
                _.unset(settingsData, path);
            } else {
                _.set(settingsData, path, true);
            }

            // To ensure data "dirty" is triggered correctly.
            settings.data = settingsData;

            await settings.save();

            return await settings.get(`data.entities.${args.id}`);
        }
    };
};
