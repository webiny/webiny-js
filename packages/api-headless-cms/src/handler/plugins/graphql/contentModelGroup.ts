import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

const contentModelGroupFetcher = ctx => ctx.models.CmsContentModelGroup;

export default {
    typeDefs: `
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
    
        input CmsContentModelGroupInput {
            name: String
            slug: String
            description: String
            icon: String
        }
        
        # Response types
        type CmsContentModelGroupResponse {
            data: CmsContentModelGroup
            error: CmsError
        }
        
        type CmsContentModelGroupListResponse {
            data: [CmsContentModelGroup]
            meta: CmsListMeta
            error: CmsError
        }
        
        extend type CmsManageQuery {
            getContentModelGroup(
                id: ID 
                where: JSON
                sort: String
            ): CmsContentModelGroupResponse
            
            listContentModelGroups(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: CmsSearchInput
            ): CmsContentModelGroupListResponse
        }
        
        extend type CmsManageMutation {
            createContentModelGroup(
                data: CmsContentModelGroupInput!
            ): CmsContentModelGroupResponse
            
            updateContentModelGroup(
                id: ID!
                data: CmsContentModelGroupInput!
            ): CmsContentModelGroupResponse
        
            deleteContentModelGroup(
                id: ID!
            ): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsManageQuery: {
            getContentModelGroup: resolveGet(contentModelGroupFetcher),
            listContentModelGroups: resolveList(contentModelGroupFetcher)
        },
        CmsManageMutation: {
            createContentModelGroup: resolveCreate(contentModelGroupFetcher),
            updateContentModelGroup: resolveUpdate(contentModelGroupFetcher),
            deleteContentModelGroup: resolveDelete(contentModelGroupFetcher)
        }
    },
    security: {
        shield: {
            CmsManageQuery: {
                getContentModel: hasScope("cms:contentModelGroup:crud"),
                listContentModels: hasScope("cms:contentModelGroup:crud")
            },
            CmsManageMutation: {
                createContentModel: hasScope("cms:contentModelGroup:crud"),
                updateContentModel: hasScope("cms:contentModelGroup:crud"),
                deleteContentModel: hasScope("cms:contentModelGroup:crud")
            }
        }
    }
};
