import Page from "../entities/Page/Page.entity";
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

export default {
    typeDefs: `
        type Author {
            id: ID
            email: String
            name: String
        }
        
        type Page {
            id: ID
            createdOn: DateTime
            author: Author
            title: String
            slug: String
            settings: JSON
            content: JSON
            category: Category
            status: String
            activeRevision: Revision
            lastRevision: Revision
            revisions: [Revision]
        }
        
        input PageInput {
            title: String!
            category: ID!
        }
        
        type PageList {
            data: [Page]
            meta: ListMeta
        }
    `,
    queryFields: `
        getPage(
            id: ID 
            where: JSON
            sort: String
        ): Page
        
        listPages(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): PageList
    `,
    mutationFields: `
        createPage(
            data: PageInput!
        ): Page
        
        deletePage(
            id: ID!
        ): Boolean
    `,
    queryResolvers: {
        getPage: resolveGet(Page),
        listPages: resolveList(Page)
    },
    mutationResolvers: {
        createPage: resolveCreate(Page),
        deletePage: resolveDelete(Page)
    }
};
