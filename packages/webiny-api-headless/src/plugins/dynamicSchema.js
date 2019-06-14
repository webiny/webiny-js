import { upperFirst } from "lodash";
import pluralize from "pluralize";
import { Entity } from "webiny-entity";
import * as resolve from "webiny-api/graphql";
import { registerPlugins, getPlugins } from "webiny-plugins";

const toGraphQLType = {
    text: "[HeadlessText]",
    datetime: "DateTime",
    number: "DateTime"
};

const toGraphQLInputType = {
    text: "[HeadlessTextInput]",
    datetime: "DateTime",
    number: "DateTime"
};

const toReadOnlyGraphQLType = {
    text: "String",
    datetime: "DateTime",
    number: "DateTime"
};

function renderField(field) {
    return field.fieldId + ": " + toGraphQLType[field.type];
}

function renderReadOnlyField(field) {
    return field.fieldId + ": " + toReadOnlyGraphQLType[field.type];
}

function renderInputField(field) {
    const type = field.fieldId + ": " + toGraphQLInputType[field.type];
    const isRequired = Boolean(field.validation.find(v => v.id === "required"));
    return type + (isRequired ? "!" : "");
}

export default async config => {
    const fieldTypePlugins = getPlugins("cms-headless-field-type");

    const db = config.database.mongodb;
    const data = await db
        .collection("CmsContentModel")
        .find({ deleted: { $ne: true } })
        .toArray();

    const plugins = [];

    data.forEach(model => {
        const typeName = upperFirst(model.modelId);
        const entityName = `Headless${typeName}`;

        const modelEntityFetcher = ctx => ctx.cms.entities[entityName];

        // Create entity plugin
        plugins.push({
            name: "entity-cms-" + model.modelId,
            type: "entity",
            namespace: "cms",
            entity: {
                name: entityName,
                factory: context => {
                    return class extends Entity {
                        static classId = "CmsContentEntry";

                        constructor() {
                            super();

                            const { user, security } = context;
                            const { User } = security.entities;
                            this.attr("modelId")
                                .char()
                                .setSkipOnPopulate()
                                .onSet(() => model.modelId)
                                .onGet(() => model.modelId)
                                .setDefaultValue(model.modelId);

                            this.attr("createdBy")
                                .entity(User)
                                .setSkipOnPopulate();

                            this.attr("updatedBy")
                                .entity(User)
                                .setSkipOnPopulate();

                            this.on("beforeCreate", async () => {
                                this.createdBy = user.id;
                            });

                            this.on("beforeUpdate", () => {
                                this.updatedBy = user.id;
                            });

                            model.fields.forEach(field => {
                                const fieldTypePlugin = fieldTypePlugins.find(
                                    pl => pl.fieldType === field.type
                                );

                                if (!fieldTypePlugin) {
                                    throw Error(
                                        `Missing plugin for headless field type "${field.type}"`
                                    );
                                }

                                // Create entity attribute
                                fieldTypePlugin.createAttribute({ field, entity: this, context });
                                const attribute = this.getAttribute(field.fieldId);
                                if (!attribute) {
                                    throw Error(
                                        `Field type plugin must create an attribute on the entity instance!\nCheck the "createAttribute" function in the "${
                                            fieldTypePlugin.name
                                        }" plugin!`
                                    );
                                }
                            });
                        }

                        static async findOne(params) {
                            params.query.modelId = model.modelId;
                            return super.findOne(params);
                        }
                        static async find(params) {
                            params.query.modelId = model.modelId;
                            return super.find(params);
                        }
                    };
                }
            }
        });

        // Create a schema plugin for each model (Management Schema)
        plugins.push({
            name: "graphql-schema-" + model.modelId + "-manage",
            type: "graphql-schema",
            schema: {
                stitching: {
                    linkTypeDefs: /* GraphQL */ `
                    type HeadlessText {
                        locale: String
                        value: String
                    }
                    
                    input HeadlessTextInput {
                        locale: String!
                        value: String!
                    }
                    
                    "${model.description}"
                    type ${typeName} {
                        id: ID
                        createdBy: User
                        updatedBy: User
                        createdOn: DateTime
                        updatedOn: DateTime
                        ${model.fields.map(renderField).join("\n")}
                    }
                    
                    input ${typeName}Input {
                        ${model.fields.map(renderInputField).join("\n")}
                    }
                    
                    type ${typeName}Response {
                        data: ${typeName}
                        error: Error
                    }
                    
                    type ${typeName}ListResponse {
                        data: [${typeName}]
                        meta: ListMeta
                        error: Error
                    }
                    
                    extend type HeadlessManageQuery {
                        get${typeName}(id: ID, where: JSON, sort: String): ${typeName}Response
                        
                        list${pluralize(typeName)}(
                            page: Int
                            perPage: Int
                            where: JSON
                            sort: JSON
                            search: SearchInput
                        ): ${typeName}ListResponse
                    }
                    
                    extend type HeadlessManageMutation{
                        create${typeName}(data: ${typeName}Input!): ${typeName}Response
                        update${typeName}(id: ID!, data: ${typeName}Input!): ${typeName}Response
                        delete${typeName}(id: ID!): DeleteResponse
                    }
                `,
                    resolvers: {
                        CmsQuery: {
                            headlessManage: {
                                fragment: "... on CmsQuery { cms }",
                                resolve: resolve.dummyResolver
                            }
                        },
                        CmsMutation: {
                            headlessManage: {
                                fragment: "... on CmsMutation { cms }",
                                resolve: resolve.dummyResolver
                            }
                        },
                        HeadlessManageQuery: {
                            [`get${typeName}`]: resolve.resolveGet(modelEntityFetcher),
                            [`list${pluralize(typeName)}`]: resolve.resolveList(modelEntityFetcher)
                        },
                        HeadlessManageMutation: {
                            [`create${typeName}`]: resolve.resolveCreate(modelEntityFetcher),
                            [`update${typeName}`]: resolve.resolveUpdate(modelEntityFetcher),
                            [`delete${typeName}`]: resolve.resolveDelete(modelEntityFetcher)
                        }
                    }
                }
            }
        });

        // Create a schema plugin for each model (Read-Only Schema)
        plugins.push({
            name: "graphql-schema-" + model.modelId + "-read",
            type: "graphql-schema",
            schema: {
                stitching: {
                    linkTypeDefs: /* GraphQL */ `
                    
                    "${model.description}"
                    type ${typeName}_ReadOnly {
                        id: ID
                        createdBy: User
                        updatedBy: User
                        createdOn: DateTime
                        updatedOn: DateTime
                        ${model.fields.map(renderReadOnlyField).join("\n")}
                    }
                    
                    type ${typeName}Response_ReadOnly {
                        data: ${typeName}_ReadOnly
                        error: Error
                    }
                    
                    type ${typeName}ListResponse_ReadOnly {
                        data: [${typeName}_ReadOnly]
                        meta: ListMeta
                        error: Error
                    }
                    
                    extend type HeadlessReadQuery {
                        get${typeName}(id: ID, where: JSON, sort: String): ${typeName}Response_ReadOnly
                        
                        list${pluralize(typeName)}(
                            page: Int
                            perPage: Int
                            where: JSON
                            sort: JSON
                            search: SearchInput
                        ): ${typeName}ListResponse_ReadOnly
                    }
                `,
                    resolvers: {
                        CmsQuery: {
                            headlessRead: {
                                fragment: "... on CmsQuery { cms }",
                                resolve: (parent, args, context) => {
                                    context.cms.headlessReadOnly = true;
                                    return {};
                                }
                            }
                        },
                        HeadlessReadQuery: {
                            [`get${typeName}`]: resolve.resolveGet(modelEntityFetcher),
                            [`list${pluralize(typeName)}`]: resolve.resolveList(modelEntityFetcher)
                        },
                        [`${typeName}_ReadOnly`]: model.fields.reduce((resolvers, field) => {
                            resolvers[field.fieldId] = (entity, args, ctx, info) => {
                                if (ctx.cms.headlessReadOnly) {
                                    const plugin = fieldTypePlugins.find(
                                        pl => pl.fieldType === field.type
                                    );
                                    return plugin.readResolver(entity, args, ctx, info);
                                }

                                return entity[info.fieldName];
                            };

                            return resolvers;
                        }, {})
                    }
                }
            }
        });
    });

    registerPlugins(plugins);
};
