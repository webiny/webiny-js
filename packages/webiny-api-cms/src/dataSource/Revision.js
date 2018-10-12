import Revision from "../entities/Revision/Revision.entity";
import {
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

export default {
    typeDefs: `
        type Revision {
            id: ID
            createdOn: DateTime
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
            id: ID
            title: String
            slug: String
            settings: JSON
            content: JSON
        }
        
        type RevisionList {
            data: [Revision]
            meta: ListMeta
        }
    `,
    queryFields: `
        getRevision(
            id: ID 
            where: JSON
            sort: String
        ): Revision
        
        listRevisions(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): RevisionList
    `,
    mutationFields: `
        createRevisionFrom(
            revisionId: ID!
        ): Revision
        
        updateRevision(
            revision: RevisionInput!
        ): Revision
    
        deleteRevision(
            id: ID!
        ): Boolean
    `,
    queryResolvers: {
        getRevision: resolveGet(Revision),
        listRevisions: resolveList(Revision)
    },
    mutationResolvers: {
        createRevisionFrom: () => ({}),
        updateRevision: resolveUpdate(Revision),
        deleteRevision: resolveDelete(Revision)
    }
};
