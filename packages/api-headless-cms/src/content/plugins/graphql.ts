import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveUpdate,
    emptyResolver,
    resolveList
} from "@webiny/commodo-graphql";
import gql from "graphql-tag";
import { merge } from "lodash";
import { hasScope } from "@webiny/api-security";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { generateSchemaPlugins } from "./schema/schemaPlugins";
import { i18nFieldType } from "./graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./graphqlTypes/i18nFieldInput";
import contentModelGroup from "./graphql/contentModelGroup";
import meta from "./graphql/meta";

const contentModelFetcher = ctx => ctx.models.CmsContentModel;

const getMutations = context => {
    if (context.cms.type === "manage") {
        return `
            createContentModel(data: CmsContentModelInput!): CmsContentModelResponse
            updateContentModel(
                id: ID!
                data: CmsContentModelInput!
            ): CmsContentModelResponse

            deleteContentModel(id: ID!): CmsDeleteResponse
        `;
    }

    return "_empty: String";
};

const getMutationResolvers = context => {
    if (context.cms.type === "manage") {
        return {
            createContentModel: hasScope("cms:content-model:create")(
                resolveCreate(contentModelFetcher)
            ),
            updateContentModel: hasScope("cms:content-model:update")(
                resolveUpdate(contentModelFetcher)
            ),
            deleteContentModel: hasScope("cms:content-model:delete")(
                resolveDelete(contentModelFetcher)
            )
        };
    }

    return {
        _empty: emptyResolver
    };
};

const getQueryResolvers = () => {
    return {
        getContentModel: hasScope("cms:content-model:get")(resolveGet(contentModelFetcher)),
        listContentModels: hasScope("cms:content-model:list")(resolveList(contentModelFetcher))
    };
};

export default () => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        prepare({ context }) {
            return generateSchemaPlugins({ context });
        },
        schema: context => ({
            typeDefs: gql`
                ${i18nFieldType("CmsString", "String")}
                ${i18nFieldInput("CmsString", "String")}
                ${i18nFieldType("CmsJSON", "JSON")}
                ${i18nFieldInput("CmsJSON", "JSON")}
                ${i18nFieldType("CmsAny", "Any")}
                ${i18nFieldInput("CmsAny", "Any")}

                input CmsSearchInput {
                    query: String
                    fields: [String]
                    operator: String
                }

                ${contentModelGroup.getTypeDefs(context)}
                ${meta.typeDefs}

                type SecurityUser {
                    id: ID
                    firstName: String
                    lastName: String
                }

                type CmsError {
                    code: String
                    message: String
                    data: JSON
                }

                type CmsCursors {
                    next: String
                    previous: String
                }

                type CmsListMeta {
                    cursors: CmsCursors
                    hasNextPage: Boolean
                    hasPreviousPage: Boolean
                    totalCount: Int
                }

                type CmsDeleteResponse {
                    data: Boolean
                    error: CmsError
                }

                type CmsContentModel {
                    id: ID
                    name: String
                    pluralizedName: String
                    modelId: String
                    pluralizedModelId: String
                    group: CmsContentModelGroup
                    description: String
                    layout: [[String]]
                    createdOn: DateTime
                    savedOn: DateTime
                    titleFieldId: String
                    fields: [CmsContentModelField]
                    totalFields: Int
                    indexes: [ContentModelIndexes]
                    lockedFields: [JSON]
                }

                input CmsContentModelInput {
                    group: ID
                    name: String
                    modelId: String
                    description: String
                    titleFieldId: String
                    fields: [CmsContentModelFieldInput]
                    indexes: [ContentModelIndexesInput]
                    layout: [[String]]
                }

                input CmsFieldValidationInput {
                    name: String!
                    message: CmsStringInput
                    settings: JSON
                }

                type CmsFieldValidation {
                    name: String!
                    message: CmsString
                    settings: JSON
                }

                type CmsFieldRenderer {
                    name: String
                }

                input CmsFieldRendererInput {
                    name: String
                }

                type PredefinedValues {
                    enabled: Boolean
                    values: CmsAnyList
                }

                input PredefinedValuesInput {
                    enabled: Boolean
                    values: CmsAnyListInput
                }

                type CmsContentModelField {
                    _id: ID
                    label: CmsString
                    helpText: CmsString
                    placeholderText: CmsString
                    fieldId: String
                    type: String
                    multipleValues: Boolean
                    predefinedValues: PredefinedValues
                    renderer: CmsFieldRenderer
                    validation: [CmsFieldValidation]
                    settings: JSON
                }

                input CmsContentModelFieldInput {
                    _id: ID
                    label: CmsStringInput
                    helpText: CmsStringInput
                    placeholderText: CmsStringInput
                    fieldId: String
                    type: String
                    multipleValues: Boolean
                    predefinedValues: PredefinedValuesInput
                    renderer: CmsFieldRendererInput
                    validation: [CmsFieldValidationInput]
                    settings: JSON
                }

                type ContentModelIndexes {
                    fields: [String]
                    createdOn: DateTime
                }

                input ContentModelIndexesInput {
                    fields: [String]
                }

                type CmsContentModelListResponse {
                    data: [CmsContentModel]
                    meta: CmsListMeta
                    error: CmsError
                }

                type CmsContentModelResponse {
                    data: CmsContentModel
                    error: CmsError
                }

                extend type Query {
                    getContentModel(id: ID, where: JSON, sort: String): CmsContentModelResponse
                    listContentModels(
                        where: JSON
                        sort: JSON
                        limit: Int
                        after: String
                        before: String
                    ): CmsContentModelListResponse
                }

                extend type Mutation {
                    ${getMutations(context)}
                }
            `,
            resolvers: merge(
                {
                    Query: getQueryResolvers(),
                    Mutation: getMutationResolvers(context)
                },
                contentModelGroup.getResolvers(context),
                meta.resolvers
            )
        })
    } as GraphQLSchemaPlugin<CmsContext>
];
