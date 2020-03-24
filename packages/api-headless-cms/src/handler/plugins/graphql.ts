import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate,
    emptyResolver
} from "@webiny/commodo-graphql";
import gql from "graphql-tag";
import { hasScope } from "@webiny/api-security";
import { CmsGraphQLContext } from "@webiny/api-headless-cms/types";
import { generateSchemaPlugins } from "./schema/schemaPlugins";
import { i18nFieldType } from "./graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./graphqlTypes/i18nFieldInput";

const contentModelFetcher = ctx => ctx.models.CmsContentModel;

const getMutations = type => {
    if (type === "manage") {
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

const getMutationResolvers = type => {
    if (type === "manage") {
        return {
            createContentModel: resolveCreate(contentModelFetcher),
            updateContentModel: resolveUpdate(contentModelFetcher),
            deleteContentModel: resolveDelete(contentModelFetcher)
        };
    }

    return {
        _empty: emptyResolver
    };
};

export default ({ type }) => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        prepare({ context }) {
            return generateSchemaPlugins({ context });
        },
        schema: {
            typeDefs: gql`
                ${i18nFieldType("CmsString", "String")}
                ${i18nFieldInput("CmsString", "String")}

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

                type CmsListMeta {
                    totalCount: Int
                    totalPages: Int
                    page: Int
                    perPage: Int
                    from: Int
                    to: Int
                    previousPage: Int
                    nextPage: Int
                }

                type CmsDeleteResponse {
                    data: Boolean
                    error: CmsError
                }

                type CmsContentModel {
                    id: ID
                    title: String
                    modelId: String
                    description: String
                    createdOn: DateTime
                    createdBy: SecurityUser
                    fields: [CmsContentModelField]
                }

                input CmsContentModelInput {
                    title: String
                    modelId: String
                    description: String
                    fields: [CmsContentModelFieldInput]
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

                type CmsContentModelField {
                    _id: String
                    label: CmsString
                    fieldId: String
                    type: String
                    localization: Boolean
                    unique: Boolean
                    validation: [CmsFieldValidation]
                    settings: JSON
                }

                input CmsContentModelFieldInput {
                    _id: String
                    label: CmsStringInput
                    fieldId: String
                    type: String
                    localization: Boolean
                    unique: Boolean
                    validation: [CmsFieldValidationInput]
                    settings: JSON
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
                        page: Int
                        perPage: Int
                        where: JSON
                        sort: JSON
                    ): CmsContentModelListResponse
                }

                extend type Mutation {
                    ${getMutations(type)}
                }
            `,
            resolvers: {
                Query: {
                    getContentModel: resolveGet(contentModelFetcher),
                    listContentModels: resolveList(contentModelFetcher)
                },
                Mutation: getMutationResolvers(type)
            }
        },
        security: {
            shield: {
                Query: {
                    getContentModel: hasScope("cms:contentModel:crud"),
                    listContentModels: hasScope("cms:contentModel:crud")
                }
            }
        }
    } as GraphQLSchemaPlugin<CmsGraphQLContext>
];
