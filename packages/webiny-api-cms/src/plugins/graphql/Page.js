import {
    resolveCreate,
    resolveUpdate,
    resolveDelete,
    resolveGet,
    resolveList
} from "webiny-api/graphql";
import createRevisionFrom from "./pageResolvers/createRevisionFrom";
import listPages from "./pageResolvers/listPages";
import listPublishedPages from "./pageResolvers/listPublishedPages";
import getPublishedPage from "./pageResolvers/getPublishedPage";
import getHomePage from "./pageResolvers/getHomePage";
import setHomePage from "./pageResolvers/setHomePage";
import getNotFoundPage from "./pageResolvers/getNotFoundPage";
import getErrorPage from "./pageResolvers/getErrorPage";
import searchTags from "./pageResolvers/searchTags";
import oembed from "./pageResolvers/oembed";

const pageFetcher = ctx => ctx.cms.entities.Page;
const elementFetcher = ctx => ctx.cms.entities.Element;

export default {
    typeDefs: /* GraphQL*/ `
        extend type SecurityUser @key(fields: "id") {
            id: ID @external
        }
            
        type PageBuilderPage {
            id: ID
            createdBy: SecurityUser
            updatedBy: SecurityUser
            savedOn: DateTime
            publishedOn: DateTime
            category: PageBuilderCategory
            version: Int
            title: String
            snippet: String
            url: String
            settings: PageBuilderPageSettings
            content: JSON
            published: Boolean
            isHomePage: Boolean
            isErrorPage: Boolean
            isNotFoundPage: Boolean
            locked: Boolean
            parent: ID
            revisions: [PageBuilderPage]
        }
        
        type PageBuilderPageSettings {
            _empty: String
        }
        
        type PageBuilderElement {
            id: ID
            name: String
            type: String
            category: String
            content: JSON
            preview: File
        }
        
        input PageBuilderElementInput {
            name: String!
            type: String!
            category: String
            content: JSON!
            preview: FileInput
        }
                
        input PageBuilderUpdateElementInput {
            name: String
            category: String
            content: JSON
            preview: FileInput
        }
        
        input PageBuilderUpdatePageInput {
            title: String
            snippet: String
            category: ID
            url: String
            settings: JSON
            content: JSON
        }
        
        input PageBuilderCreatePageInput {
            category: ID!
        }
        
        # Response types
        type PageBuilderPageListMeta {
            totalCount: Int
            totalPages: Int
            page: Int
            perPage: Int
            from: Int
            to: Int
            previousPage: Int
            nextPage: Int
        }

        type PageBuilderPageDeleteResponse {
            data: Boolean
            error: PageBuilderError
        }
            
        type PageBuilderPageResponse {
            data: PageBuilderPage
            error: PageBuilderError
        }
        
        type PageBuilderPageListResponse {
            data: [PageBuilderPage]
            meta: PageBuilderListMeta
            error: PageBuilderError
        }
        
        type PageBuilderElementResponse {
            data: PageBuilderElement
            error: PageBuilderError
        }
        
        type PageBuilderElementListResponse {
            data: [PageBuilderElement]
            meta: PageBuilderListMeta
        }
        
        type PageBuilderSearchTagsResponse {
            data: [String] 
        }
        
        type PageBuilderOembedResponse {
            data: JSON
            error: PageBuilderError
        }
        
        input PageBuilderOEmbedInput {
            url: String!
            width: Int
            height: Int
        }
        
        input PageBuilderPageSortInput {
            title: Int
            publishedOn: Int
        }
        
        enum PageBuilderTagsRule {
          ALL
          ANY
        }
        
        extend type PageBuilderQuery {
            getPage(
                id: ID 
                where: JSON
                sort: String
            ): PageBuilderPageResponse
            
            getPublishedPage(id: String, url: String, parent: String): PageBuilderPageResponse
            
            # Returns page set as home page (managed in CMS settings).
            getHomePage: PageBuilderPageResponse
            
            # Returns 404 (not found) page (managed in CMS settings).
            getNotFoundPage: PageBuilderPageResponse
            
            # Returns error page (managed in CMS settings).
            getErrorPage: PageBuilderPageResponse
            
            listPages(
                page: Int
                perPage: Int
                sort: JSON
                search: String
                parent: String
            ): PageBuilderPageListResponse
            
            listPublishedPages(
                search: String
                category: String
                parent: String
                tags: [String]
                tagsRule: PageBuilderTagsRule
                sort: PageBuilderPageSortInput
                page: Int
                perPage: Int
            ): PageBuilderPageListResponse
            
            listElements(perPage: Int): PageBuilderElementListResponse
            
            # Returns existing tags based on given search term.        
            searchTags(query: String!): PageBuilderSearchTagsResponse
            
            oembedData(
                url: String! 
                width: String
                height: String
            ): PageBuilderOembedResponse
        }
        
        extend type PageBuilderMutation {
            createPage(
                data: PageBuilderCreatePageInput!
            ): PageBuilderPageResponse
            
            # Sets given page as new homepage.
            setHomePage(id: ID!): PageBuilderPageResponse
            
            # Create a new revision from an existing revision
            createRevisionFrom(
                revision: ID!
            ): PageBuilderPageResponse
            
            # Update revision
             updateRevision(
                id: ID!
                data: PageBuilderUpdatePageInput!
            ): PageBuilderPageResponse
            
            # Publish revision
            publishRevision(
                id: ID!
            ): PageBuilderPageResponse
            
            # Delete page and all of its revisions
            deletePage(
                id: ID!
            ): PageBuilderDeleteResponse
            
            # Delete a single revision
            deleteRevision(
                id: ID!
            ): PageBuilderDeleteResponse
            
            # Create element
            createElement(
                data: PageBuilderElementInput!
            ): PageBuilderElementResponse
            
            updateElement(      
                id: ID!
                data: PageBuilderUpdateElementInput!
            ): PageBuilderElementResponse
            
            # Delete element
            deleteElement(
                id: ID!
            ): PageBuilderDeleteResponse
            
            updateImageSize: PageBuilderDeleteResponse
        },
    `,
    resolvers: {
        PageBuilderPage: {
            createdBy(page) {
                return { __typename: "SecurityUser", id: page.createdBy };
            },
            updatedBy(page) {
                return { __typename: "SecurityUser", id: page.updatedBy };
            }
        },
        PageBuilderQuery: {
            getPage: resolveGet(pageFetcher),
            listPages: listPages(pageFetcher),
            listPublishedPages,
            getPublishedPage,
            getHomePage,
            getNotFoundPage,
            getErrorPage,
            listElements: resolveList(elementFetcher),
            searchTags: searchTags,
            oembedData: oembed
        },
        PageBuilderMutation: {
            // Creates a new page
            createPage: resolveCreate(pageFetcher),
            // Deletes the entire page
            deletePage: resolveDelete(pageFetcher),
            // Sets given page as home page.
            setHomePage,
            // Creates a revision from the given revision
            createRevisionFrom: createRevisionFrom(pageFetcher),
            // Updates revision
            updateRevision: resolveUpdate(pageFetcher),
            // Publish revision (must be given an exact revision ID to publish)
            publishRevision: (_: any, args: Object, ctx: Object, info: Object) => {
                args.data = { published: true };

                return resolveUpdate(pageFetcher)(_, args, ctx, info);
            },
            // Delete a revision
            deleteRevision: resolveDelete(pageFetcher),
            // Creates a new element
            createElement: resolveCreate(elementFetcher),
            // Updates an element
            updateElement: resolveUpdate(elementFetcher),
            // Deletes an element
            deleteElement: resolveDelete(elementFetcher)
        },
        PageBuilderPageSettings: {
            _empty: () => ""
        }
    }
};
