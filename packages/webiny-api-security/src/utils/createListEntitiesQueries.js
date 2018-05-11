import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLID,
    GraphQLNonNull
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
            const list = app.entities.getEntityClasses().map(entityClass => entityClass.describe());
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
            name: "getEntityPermissionType",
            fields: {
                permissions: {
                    type: new GraphQLObjectType({
                        name: "entityPermissions",
                        fields: {
                            id: { type: GraphQLID },
                            owner: { type: GraphQLJSON },
                            group: { type: GraphQLJSON },
                            other: { type: GraphQLJSON }
                        }
                    })
                },
                entity: {
                    type: new GraphQLObjectType({
                        name: "entityDescription",
                        fields: {
                            name: { type: GraphQLString },
                            id: { type: GraphQLString },
                            attributes: {
                                type: new GraphQLList(GraphQLJSON)
                            }
                        }
                    })
                }
            }
        })
    });

    schema.query["getEntityPermission"] = {
        description: "Returns an entity.",
        type: schema.getType("getEntityPermissionType"),
        args: {
            id: { type: GraphQLID }
        },
        async resolve(root, args) {
            const settings = await SecuritySettings.load();
            return {
                entity: app.entities.getEntityClass(args.id).describe(),
                permissions: await settings.get(`data.entities.${args.id}`)
            };
        }
    };

    schema.mutation["toggleEntityOperationPermission"] = {
        description: "Toggles entity operation permissions.",
        type: schema.getType("getEntityPermissionType"),
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) },
            class: { type: new GraphQLNonNull(GraphQLString) },
            operation: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root, args) {
            const { id, operation } = args;
            const settings = await SecuritySettings.load();

            const settingsData = _.cloneDeep(settings.data);
            let path = `entities.${id}.${args.class}.operations.${operation}`;

            if (_.get(settingsData, path)) {
                _.unset(settingsData, path);
            } else {
                _.set(settingsData, path, true);
            }

            // To ensure data "dirty" is triggered correctly.
            settings.data = settingsData;

            await settings.save();

            return {
                entity: app.entities.getEntityClass(args.id).describe(),
                permissions: await settings.get(`data.entities.${args.id}`)
            };
        }
    };

    schema.mutation["toggleEntityAttributePermission"] = {
        description: "Toggles entity attribute permissions.",
        type: schema.getType("getEntityPermissionType"),
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) },
            class: { type: new GraphQLNonNull(GraphQLString) },
            attribute: { type: new GraphQLNonNull(GraphQLString) },
            operation: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root, args) {
            const { id, attribute, operation } = args;
            const settings = await SecuritySettings.load();

            const settingsData = _.cloneDeep(settings.data);
            if (operation) {
                let path = `entities.${id}.${args.class}.attributes.${attribute}.${operation}`;
                if (_.get(settingsData, path)) {
                    _.unset(settingsData, path);
                } else {
                    _.set(settingsData, path, true);
                }
            }

            // To ensure data "dirty" is triggered correctly.
            settings.data = settingsData;

            await settings.save();

            return {
                entity: app.entities.getEntityClass(args.id).describe(),
                permissions: await settings.get(`data.entities.${args.id}`)
            };
        }
    };
};
