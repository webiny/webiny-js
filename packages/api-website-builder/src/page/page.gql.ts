import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";
import type { CmsFieldTypePlugins, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { ErrorResponse, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ensureAuthentication } from "~/utils/ensureAuthentication";
import { resolve } from "~/utils/resolve";
import type { WebsiteBuilderContext } from "~/types";
import { PAGE_MODEL_ID } from "~/page/page.model";

export interface CreatePageTypeDefsParams {
    model: CmsModel;
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

const removeFieldRequiredValidation = (field: CmsModelField) => {
    if (field.validation) {
        field.validation = field.validation.filter(validation => validation.name !== "required");
    }
    if (field.listValidation) {
        field.listValidation = field.listValidation.filter(v => v.name !== "required");
    }
    return field;
};

const createUpdateFields = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.reduce<CmsModelField[]>((collection, field) => {
        collection.push(removeFieldRequiredValidation({ ...field }));
        return collection;
    }, []);
};

export const createPageTypeDefs = (params: CreatePageTypeDefsParams): string => {
    const { model, models, plugins: fieldTypePlugins } = params;
    const { fields } = model;

    const fieldTypes = renderFields({
        models,
        model,
        fields,
        type: "manage",
        fieldTypePlugins
    });
    const inputCreateFields = renderInputFields({
        models,
        model,
        fields,
        fieldTypePlugins
    });
    const inputUpdateFields = renderInputFields({
        models,
        model,
        fields: createUpdateFields(fields),
        fieldTypePlugins
    });

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}
       
       

        type WbPage {
            id: ID!
            createdOn: DateTime
            modifiedOn: DateTime
            savedOn: DateTime
            createdBy: AcoUser
            modifiedBy: AcoUser
            savedBy: AcoUser
            
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        ${inputCreateFields.map(f => f.typeDefs).join("\n")}
        
        input WbPageCreateInput {
             # Pass an ID if you want to create a folder with a specific ID.
             id: ID  
             
             ${inputCreateFields.map(f => f.fields).join("\n")}
        }
                
         input WbPageUpdateInput {
            ${inputUpdateFields.map(f => f.fields).join("\n")}
        }
        
        input WbPagesListWhereInput {
            createdBy: ID
        }
        
        type WbPageResponse {
            data: WbPage
            error: WbError
        }

        type WbPagesListResponse {
            data: [WbPage]
            error: WbError
            meta: WbMeta
        }

         type WbPageModelResponse {
            data: JSON
            error: WbError
        }

        extend type WbQuery {
            getPageModel: WbPageModelResponse!
            getPageByPath(path: String!): WbPageResponse
            getPageTemplate(slug: String!): WbPageResponse
            getPage(id: ID!): WbPageResponse
            listPages(
                where: WbPagesListWhereInput!
                limit: Int
                after: String
                sort: WbSort
            ): WbPagesListResponse
        }

        extend type WbMutation {
            createPage(data: WbPageCreateInput!): WbPageResponse
            updatePage(id: ID!, data: FolderUpdateInput!): WbPageResponse
            deletePage(id: ID!): WbBooleanResponse
        }
    `;
};

export const createPagesSchema = (params: CreatePageTypeDefsParams) => {
    const pageGraphQL = new GraphQLSchemaPlugin<WebsiteBuilderContext>({
        typeDefs: createPageTypeDefs(params),
        resolvers: {
            WbQuery: {
                getPageModel: async (_, __, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.cms.getModel(PAGE_MODEL_ID);
                    });
                },
                getPageByPath: async (_, { path }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        console.log("Getting page with path:", path);
                        return context.websiteBuilder.page.get();
                    });
                },
                getPageTemplate: async (_, { template }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        console.log("Getting page with template:", template);
                        return context.websiteBuilder.page.get();
                    });
                },
                getPage: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        console.log("Getting page with id:", id);
                        return context.websiteBuilder.page.get();
                    });
                },
                listPages: async (_, args: any, context) => {
                    try {
                        ensureAuthentication(context);
                        console.log("Listing pages with args:", args);
                        return context.websiteBuilder.page.list();
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            WbMutation: {
                createPage: async (_, { data }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        console.log("Creating page with data:", data);
                        return context.websiteBuilder.page.create();
                    });
                },
                updatePage: async (_, { id, data }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        console.log("Updating page with ID:", id, "and data:", data);
                        return context.websiteBuilder.page.update();
                    });
                },
                deletePage: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        console.log("Deleting page with ID:", id);
                        return context.websiteBuilder.page.delete();
                    });
                }
            }
        }
    });

    pageGraphQL.name = "wb.graphql.pages";

    return pageGraphQL;
};
