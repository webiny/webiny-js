import { dummyResolver } from "webiny-api/graphql";
import { registerPlugins, getPlugins } from "webiny-plugins";
import { upperFirst } from "lodash";
import pluralize from "pluralize";

const toGraphQLType = {
    text: "String",
    datetime: "DateTime",
    number: "DateTime"
};

function renderField(field) {
    return field.fieldId + ": " + toGraphQLType[field.type];
}

function renderInputField(field) {
    const type = renderField(field);
    const isRequired = Boolean(field.validation.find(v => v.id === "required"));
    return type + (isRequired ? "!" : "");
}



export default async config => {
    const db = config.database.mongodb;
    const data = await db
        .collection("CmsContentModel")
        .find({ deleted: { $ne: true } })
        .toArray();

    const plugins = [];
    for (let i = 0; i < data.length; i++) {
        const model = data[i];
        const typeName = upperFirst(model.modelId);

        // Create a schema plugin for each model
        plugins.push({
            name: "graphql-schema-" + model.modelId,
            type: "graphql-schema",
            schema: {
                stitching: {
                    linkTypeDefs: /* GraphQL */ `
                    "${model.description}"
                    type ${typeName} {
                        id: ID
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
                        create${typeName}(data: ${typeName}Input): ${typeName}Response
                    }
                `,
                    resolvers: {
                        CmsQuery: {
                            headlessManage: {
                                fragment: "... on CmsQuery { cms }",
                                resolve: dummyResolver
                            }
                        },
                        CmsMutation: {
                            headlessManage: {
                                fragment: "... on CmsMutation { cms }",
                                resolve: dummyResolver
                            }
                        },
                        HeadlessManageQuery: {
                            [`get${typeName}`]: dummyResolver,
                            [`list${pluralize(typeName)}`]: dummyResolver
                        },
                        HeadlessManageMutation: {
                            [`create${typeName}`]: async (_, args, context) => {
                                try {
                                    await validateEntryData(model, args.data, null, context);
                                    const { ContentEntry } = context.cms.entities;
                                } catch (err) {}
                            }
                            //[`update${typeName}`]: dummyResolver,
                            //[`delete${typeName}`]: dummyResolver
                        }
                    }
                }
            }
        });
    }

    registerPlugins(plugins);
};
