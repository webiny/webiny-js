import {
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";
import createRevisionFrom from "./revisionResolvers/createRevisionFrom";

const revisionFetcher = ctx => ctx.cms.Revision;

export default {
    typeDefs: `
        type Revision {
            id: ID
            createdOn: DateTime
            savedOn: DateTime
            name: String
            title: String
            slug: String
            settings: JSON
            content: JSON
            published: Boolean
            locked: Boolean
            page: Page
        }
        
        input RevisionInput {
            title: String
            slug: String
            settings: JSON
            content: JSON
        }
        
        type RevisionResponse {
            data: Revision
            error: Error
        }
        
        type RevisionListResponse {
            data: [Revision]
            meta: ListMeta
            error: Error
        }
    `,
    queryFields: `
        getRevision(
            id: ID 
            where: JSON
            sort: String
        ): RevisionResponse
        
        listRevisions(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): RevisionListResponse
    `,
    mutationFields: `
        createRevisionFrom(
            revisionId: ID!
        ): RevisionResponse
        
        updateRevision(
            id: ID!
            data: RevisionInput!
        ): RevisionResponse
    
        deleteRevision(
            id: ID!
        ): DeleteResponse
    `,
    queryResolvers: {
        getRevision: resolveGet(revisionFetcher),
        listRevisions: resolveList(revisionFetcher)
    },
    mutationResolvers: {
        createRevisionFrom: createRevisionFrom(revisionFetcher),
        updateRevision: resolveUpdate(revisionFetcher),
        deleteRevision: resolveDelete(revisionFetcher)
    }
};
