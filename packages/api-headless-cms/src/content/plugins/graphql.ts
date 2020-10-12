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
import { hasScope, hasCmsPermission } from "@webiny/api-security";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { generateSchemaPlugins } from "./schema/schemaPlugins";
import { i18nFieldType } from "./graphqlTypes/i18nFieldType";
import { i18nFieldInput } from "./graphqlTypes/i18nFieldInput";
import contentModelGroup from "./graphql/contentModelGroup";
import meta from "./graphql/meta";

const checkContentModelListPermission = async ({ args, context, permission }) => {
    const { CmsContentModelGroup, CmsContentModel } = context.models;
    const identity = context.security.getIdentity();

    const query = { ...args.where };
    const find = { query };

    const contentModelData = await CmsContentModel.find(find);

    let allowed = Boolean(contentModelData);

    // Only load your own documents
    if (allowed && permission.own) {
        if (Array.isArray(contentModelData)) {
            allowed = contentModelData.every(item => item.createdBy === identity.id);
        } else {
            allowed = contentModelData.createdBy === identity.id;
        }
    }

    // Only load content in specific models
    if (allowed && Array.isArray(permission.models) && permission.models.length) {
        if (Array.isArray(contentModelData)) {
            allowed = contentModelData.every(item => permission.models.includes(item.modelId));
        } else {
            allowed = permission.models.includes(contentModelData.modelId);
        }
    }

    // Only load content in specific groups
    if (allowed && Array.isArray(permission.groups) && permission.groups.length) {
        const contentModelGroupData = await CmsContentModelGroup.find({
            query: { slug: { $in: permission.groups } }
        });

        const contentModelGroupIDsFromPermission = [];

        if (Array.isArray(contentModelGroupData)) {
            for (let i = 0; i < contentModelGroupData.length; i++) {
                const contentModelGroup = contentModelGroupData[i];
                contentModelGroupIDsFromPermission.push(contentModelGroup.id);
            }
        }

        if (Array.isArray(contentModelData)) {
            const contentModelGroupIDs = [];
            for (let i = 0; i < contentModelData.length; i++) {
                const contentModelGroup = await contentModelData[i].group;
                // If not already exist in list, add the ID
                if (contentModelGroupIDs.indexOf(contentModelGroup.id) === -1) {
                    contentModelGroupIDs.push(contentModelGroup.id);
                }
            }

            allowed = contentModelGroupIDs.every(id =>
                contentModelGroupIDsFromPermission.includes(id)
            );
        } else {
            const contentModelGroup = await contentModelData.group;

            allowed = contentModelGroupIDsFromPermission.includes(contentModelGroup.id);
        }
    }

    return allowed;
};

const checkContentModelUpdatePermission = async ({ args, context, permission }) => {
    const { CmsContentModelGroup, CmsContentModel } = context.models;
    const identity = context.security.getIdentity();

    const instance = await CmsContentModel.findById(args.id);

    let allowed = Boolean(instance);

    // If "own", check for owner
    if (allowed && permission.own) {
        allowed = instance.createdBy === identity.id;
    }
    // if "models", check whether the request is for these models
    if (allowed && Array.isArray(permission.models) && permission.models.length) {
        allowed = permission.models.includes(instance.modelId);
    }

    // if "groups", check whether the request is for these groups
    if (allowed && Array.isArray(permission.groups) && permission.groups.length) {
        const groupIDs = await CmsContentModelGroup.find({
            query: { slug: { $in: permission.groups } }
        });

        const contentModelGroup = await instance.group;

        allowed = groupIDs.includes(contentModelGroup.id);
    }

    return allowed;
};

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
            createContentModel: hasScope("cms.manage.contentModel.update")(
                resolveCreate(contentModelFetcher)
            ),
            updateContentModel: hasCmsPermission(
                "cms.manage.contentModel.update",
                checkContentModelUpdatePermission
            )(resolveUpdate(contentModelFetcher)),
            deleteContentModel: hasScope("cms.manage.contentModel.delete")(
                resolveDelete(contentModelFetcher)
            )
        };
    }

    return {
        _empty: emptyResolver
    };
};

/**
 * This is a hack that we introduced because the actual fix is in another branch, which is not soon-to-be-merged.
 * So, we apply scopes-check in the manage API, as usual. For the READ/PREVIEW, we don't apply any checks because
 * the auth check is already done in the "context-cms-validate-access-token" plugin, which only runs in these two
 * types of APIs (so, the check isn't executed in the MANAGE API).
 * @param type
 */
const getQueryResolvers = type => {
    if (type === "manage") {
        return {
            getContentModel: hasCmsPermission(
                "cms.manage.contentModel.list",
                checkContentModelListPermission
            )(resolveGet(contentModelFetcher)),
            listContentModels: hasCmsPermission(
                "cms.manage.contentModel.list",
                checkContentModelListPermission
            )(resolveList(contentModelFetcher))
        };
    }

    return {
        getContentModel: resolveGet(contentModelFetcher),
        listContentModels: resolveList(contentModelFetcher)
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
                ${i18nFieldType("CmsJSON", "JSON")}
                ${i18nFieldInput("CmsJSON", "JSON")}
                ${i18nFieldType("CmsAny", "Any")}
                ${i18nFieldInput("CmsAny", "Any")}

                input CmsSearchInput {
                    query: String
                    fields: [String]
                    operator: String
                }

                ${contentModelGroup.getTypeDefs(type)}
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
                    ${getMutations(type)}
                }
            `,
            resolvers: merge(
                {
                    Query: getQueryResolvers(type),
                    Mutation: getMutationResolvers(type)
                },
                contentModelGroup.getResolvers(type),
                meta.resolvers
            )
        }
    } as GraphQLSchemaPlugin<CmsContext>
];
