import {
    resolveCreate,
    resolveUpdate,
    resolveDelete,
    resolveGet,
    resolveList
} from "webiny-api/graphql";
import createRevisionFrom from "./pageResolvers/createRevisionFrom";
import listPages from "./pageResolvers/listPages";

const pageFetcher = ctx => ctx.cms.Page;
const elementFetcher = ctx => ctx.cms.Element;

export default {
    typeDefs: `
        type Page {
            id: ID
            createdBy: Author
            updatedBy: Author
            savedOn: DateTime
            category: Category
            version: Int
            title: String
            slug: String
            settings: JSON
            content: JSON
            published: Boolean
            locked: Boolean
            parent: ID
            revisions: [Page]
        }
        
        type Element {
            id: ID
            name: String
            type: String
            group: String
            content: JSON
            keywords: [String]
        }
        
        input ElementInput {
            name: String!
            type: String!
            group: String
            content: JSON!
            keywords: [String]
        }
        
        input UpdatePageInput {
            title: String
            slug: String
            settings: JSON
            content: JSON
        }
        
        input CreatePageInput {
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
        
        type ElementResponse {
            data: Element
            error: Error
        }
        
        type ElementListResponse {
            data: [Element]
            meta: ListMeta
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
            sort: JSON
            search: String
        ): PageListResponse
        
        listElements: ElementListResponse
    `,
    mutationFields: `
        createPage(
            data: CreatePageInput!
        ): PageResponse
        
        # Create a new revision from an existing revision
        createRevisionFrom(
            revision: ID!
        ): PageResponse
        
        # Update revision
         updateRevision(
            id: ID!
            data: UpdatePageInput!
        ): PageResponse
        
        # Publish revision
        publishRevision(
            id: ID!
        ): PageResponse
        
        # Delete page and all of its revisions
        deletePage(
            id: ID!
        ): DeleteResponse
        
        # Delete a single revision
        deleteRevision(
            id: ID!
        ): DeleteResponse
        
        # Create element
        createElement(
            data: ElementInput!
        ): ElementResponse
    `,
    queryResolvers: {
        getPage: resolveGet(pageFetcher),
        listPages: listPages(pageFetcher),
        listElements: resolveList(elementFetcher)
    },
    mutationResolvers: {
        // Creates a new page
        createPage: resolveCreate(pageFetcher),
        // Deletes the entire page
        deletePage: resolveDelete(pageFetcher),
        // Creates a revision from the given revision
        createRevisionFrom: createRevisionFrom(pageFetcher),
        // Updates revision
        updateRevision: resolveUpdate(pageFetcher),
        // Publish revision (must be given an exact revision ID to publish)
        publishRevision: (_, args, ctx, info) => {
            args.data = { published: true };

            return resolveUpdate(pageFetcher)(_, args, ctx, info);
        },
        // Delete a revision
        deleteRevision: resolveDelete(pageFetcher),
        // Creates a new element
        createElement: resolveCreate(elementFetcher)
    }
};
