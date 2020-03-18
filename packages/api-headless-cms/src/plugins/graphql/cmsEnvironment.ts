import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

const environmentFetcher = ctx => ctx.models.CmsEnvironment;

export default {
    typeDefs: `
        type CmsEnvironment {
            id: ID
            createdOn: DateTime
            name: String
            slug: String
            description: String
            default: Boolean
            setAsDefaultOn: DateTime
        }
    
        input CmsEnvironmentInput {
            name: String
            slug: String
            description: String
            default: Boolean
        }
        
        # Response types
        type CmsEnvironmentResponse {
            data: CmsEnvironment
            error: CmsError
        }
        
        type CmsEnvironmentListResponse {
            data: [CmsEnvironment]
            meta: CmsListMeta
            error: CmsError
        }
        
        extend type CmsManageQuery {
            getEnvironment(
                id: ID 
                where: JSON
                sort: String
            ): CmsEnvironmentResponse
            
            listEnvironments(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: CmsSearchInput
            ): CmsEnvironmentListResponse
        }
        
        extend type CmsManageMutation {
            createEnvironment(
                data: CmsEnvironmentInput!
            ): CmsEnvironmentResponse
            
            updateEnvironment(
                id: ID!
                data: CmsEnvironmentInput!
            ): CmsEnvironmentResponse
        
            deleteEnvironment(
                id: ID!
            ): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsManageQuery: {
            getEnvironment: resolveGet(environmentFetcher),
            listEnvironments: resolveList(environmentFetcher)
        },
        CmsManageMutation: {
            createEnvironment: resolveCreate(environmentFetcher),
            updateEnvironment: resolveUpdate(environmentFetcher),
            deleteEnvironment: resolveDelete(environmentFetcher)
        }
    },
    security: {
        shield: {
            CmsManageQuery: {
                getContentModel: hasScope("cms:environment:crud"),
                listContentModels: hasScope("cms:environment:crud")
            },
            CmsManageMutation: {
                createContentModel: hasScope("cms:environment:crud"),
                updateContentModel: hasScope("cms:environment:crud"),
                deleteContentModel: hasScope("cms:environment:crud")
            }
        }
    }
};
