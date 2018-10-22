import { resolveCreate, resolveDelete, resolveGet, resolveList } from "webiny-api/graphql";

const pageFetcher = ctx => ctx.cms.Page;

export default {
    typeDefs: `
        type Page {
            id: ID
            savedOn: DateTime
            createdBy: Author
            category: Category
            status: String
            activeRevision: Revision
            lastRevision: Revision
            revisions: [Revision]
        }
        
        input PageInput {
            category: ID!
        }
        
        # Response types
        
        type PageResponse {
            data: Page
            error: Error
        }
        
        type PageListResponse {
            data: [Page]
            meta: ListMeta
            error: Error
        }
    `,
    queryFields: `
        getPage(
            id: ID 
            where: JSON
            sort: String
        ): PageResponse
        
        listPages(
            page: Int
            perPage: Int
            where: JSON
            sort: JSON
            search: SearchInput
        ): PageListResponse
    `,
    mutationFields: `
        createPage(
            data: PageInput!
        ): PageResponse
        
        deletePage(
            id: ID!
        ): DeleteResponse
    `,
    queryResolvers: {
        getPage: resolveGet(pageFetcher),
        listPages: resolveList(pageFetcher)
    },
    mutationResolvers: {
        createPage: resolveCreate(pageFetcher),
        deletePage: resolveDelete(pageFetcher)
    }
};
