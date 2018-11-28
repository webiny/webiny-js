// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const tagFetcher = ctx => ctx.cms.entities.Tag;

export default {
    typeDefs: `
        type Tag {
            id: ID
            createdOn: DateTime
            name: String
        }
    
        input TagInput {
            name: String
        }
        
        # Response types
        
        type TagResponse {
            data: Tag
            error: Error
        }
        
        type TagListResponse {
            data: [Tag]
            meta: ListMeta
            error: Error
        }
        
        extend type CmsQuery {
            getTag(
                id: ID 
                where: JSON
                sort: String
            ): TagResponse
            
            listTags(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: SearchInput
            ): TagListResponse
        }
        
        extend type CmsMutation {
            createTag(
                data: TagInput!
            ): TagResponse
            
            updateTag(
                id: ID!
                data: TagInput!
            ): TagResponse
        
            deleteTag(
                id: ID!
            ): DeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            getTag: resolveGet(tagFetcher),
            listTags: resolveList(tagFetcher)
        },
        CmsMutation: {
            createTag: resolveCreate(tagFetcher),
            updateTag: resolveUpdate(tagFetcher),
            deleteTag: resolveDelete(tagFetcher)
        }
    }
};
