// @flow
import {
    resolveCreate,
    resolveUpdate,
    resolveDelete,
    resolveGet,
    resolveList
} from "webiny-api/graphql";
import UserType from "webiny-api/dataSource/typeDefs/User";
import createRevisionFrom from "./pageResolvers/createRevisionFrom";
import listPages from "./pageResolvers/listPages";
import listPublishedPages from "./pageResolvers/listPublishedPages";
import oembed from "./pageResolvers/oembed";
import resolveUser from "./typeResolvers/resolveUser";

const pageFetcher = ctx => ctx.cms.Page;
const elementFetcher = ctx => ctx.cms.Element;

export default {
    typeDefs: () => [
        UserType.typeDefs,
        `type Page {
            id: ID
            createdBy: User
            updatedBy: User
            savedOn: DateTime
            publishedOn: DateTime
            category: Category
            version: Int
            title: String
            snippet: String
            url: String
            settings: PageSettings
            content: JSON
            published: Boolean
            locked: Boolean
            parent: ID
            revisions: [Page]
        }
        
        type PageSettings {
            _empty: String
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
            snippet: String
            category: ID
            url: String
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
        
        type OembedResponse {
            data: JSON
            error: Error
        }
        
        input OEmbedInput {
            url: String!
            width: Int
            height: Int
        }
        
        input PageSortInput {
            title: Int
            publishedOn: Int
        }
        
        enum TagsRule {
          ALL
          ANY
        }
        
        extend type CmsQuery {
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
            
            listPublishedPages(
                page: Int
                perPage: Int
                sort: PageSortInput
                tags: [String]
                tagsRule: TagsRule
            ): PageListResponse
            
            listElements: ElementListResponse
            
            oembedData(
                url: String! 
                width: String
                height: String
            ): OembedResponse
        }
        
        extend type CmsMutation {
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
        },
    `
    ],
    resolvers: {
        CmsQuery: {
            getPage: resolveGet(pageFetcher),
            listPages: listPages(pageFetcher),
            listPublishedPages: listPublishedPages(pageFetcher),
            listElements: resolveList(elementFetcher),
            oembedData: oembed
        },
        CmsMutation: {
            // Creates a new page
            createPage: resolveCreate(pageFetcher),
            // Deletes the entire page
            deletePage: resolveDelete(pageFetcher),
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
            createElement: resolveCreate(elementFetcher)
        },
        Page: {
            createdBy: resolveUser("createdBy"),
            updatedBy: resolveUser("updatedBy")
        },
        PageSettings: {
            _empty: () => ""
        }
    }
};
