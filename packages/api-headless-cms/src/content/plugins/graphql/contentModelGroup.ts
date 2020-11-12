// TODO remove
// @ts-nocheck
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope, hasCmsPermission } from "@webiny/api-security";

const checkEnvironmentPermission = async ({ context }) => {
    let allowed = true;
    const permission = await context.security.getPermission("cms.manage.environment");
    // TODO: Need to check whether to allow this or not
    if (!permission) {
        return allowed;
    }

    if (Array.isArray(permission.environments) && permission.environments.length) {
        const currentEnvironment = context.cms.environment;

        allowed = permission.environments.includes(currentEnvironment);
    }

    return allowed;
};

const checkContentModelGroupListPermission = async ({ args, context, permission }) => {
    const { CmsContentModelGroup } = context.models;
    const identity = context.security.getIdentity();

    let allowed = true;

    const query = { ...args.where };
    const find = { query };

    const contentModelGroupData = await CmsContentModelGroup.find(find);

    // Only load your own documents
    if (permission.own && contentModelGroupData) {
        if (Array.isArray(contentModelGroupData)) {
            allowed = contentModelGroupData.every(group => group.createdBy === identity.id);
        } else {
            allowed = contentModelGroupData.createdBy === identity.id;
        }
    }
    // Check CMS environment permission
    if (allowed) {
        allowed = await checkEnvironmentPermission({ context });
    }

    return allowed;
};

const contentModelGroupFetcher = ctx => ctx.models.CmsContentModelGroup;

export default {
    getTypeDefs(type) {
        let output = /* GraphQL */ `
            type CmsContentModelGroup {
                id: ID
                createdOn: DateTime
                name: String
                contentModels: [CmsContentModel]
                totalContentModels: Int
                slug: String
                description: String
                icon: String
            }
        `;

        if (type === "manage") {
            output += /* GraphQL */ `
                input CmsContentModelGroupInput {
                    name: String
                    slug: String
                    description: String
                    icon: String
                }

                type CmsContentModelGroupResponse {
                    data: CmsContentModelGroup
                    error: CmsError
                }

                type CmsContentModelGroupListResponse {
                    data: [CmsContentModelGroup]
                    meta: CmsListMeta
                    error: CmsError
                }

                extend type Query {
                    getContentModelGroup(
                        id: ID
                        where: JSON
                        sort: String
                    ): CmsContentModelGroupResponse

                    listContentModelGroups(
                        where: JSON
                        sort: JSON
                        search: CmsSearchInput
                        limit: Int
                        after: String
                        before: String
                    ): CmsContentModelGroupListResponse
                }

                extend type Mutation {
                    createContentModelGroup(
                        data: CmsContentModelGroupInput!
                    ): CmsContentModelGroupResponse

                    updateContentModelGroup(
                        id: ID!
                        data: CmsContentModelGroupInput!
                    ): CmsContentModelGroupResponse

                    deleteContentModelGroup(id: ID!): CmsDeleteResponse
                }
            `;
        }

        return output;
    },

    getResolvers(type) {
        if (type !== "manage") {
            return {};
        }

        return {
            Query: {
                getContentModelGroup: hasScope("cms.manage.contentModelGroup.list")(
                    resolveGet(contentModelGroupFetcher)
                ),
                listContentModelGroups: hasCmsPermission(
                    "cms.manage.contentModelGroup.list",
                    checkContentModelGroupListPermission
                )(resolveList(contentModelGroupFetcher))
            },
            Mutation: {
                createContentModelGroup: hasScope("cms.manage.contentModelGroup.update")(
                    resolveCreate(contentModelGroupFetcher)
                ),
                updateContentModelGroup: hasScope("cms.manage.contentModelGroup.update")(
                    resolveUpdate(contentModelGroupFetcher)
                ),
                deleteContentModelGroup: hasScope("cms.manage.contentModelGroup.delete")(
                    resolveDelete(contentModelGroupFetcher)
                )
            }
        };
    }
};
