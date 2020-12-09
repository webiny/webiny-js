import { ListResponse, Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PbContext } from "@webiny/api-page-builder/types";
import Error from "@webiny/error";
import resolve from "./utils/resolve";
import pageSettings from "./pages/pageSettings";
import { fetchEmbed, findProvider } from "./pages/oEmbed";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbPageCategory {
                slug: String
                name: String
                url: String
            }

            type PbPage {
                id: ID
                editor: String
                createdFrom: ID
                createdBy: PbCreatedBy
                createdOn: DateTime
                savedOn: DateTime
                publishedOn: DateTime
                error: Boolean
                notFound: Boolean
                locked: Boolean
                category: PbPageCategory
                version: Int
                title: String
                status: String
                snippet: String
                url: String
                fullUrl: String
                settings: PbPageSettings
                content: JSON
                revisions: [PbPageRevision]
                home: Boolean
            }

            type PbPageRevision {
                id: ID
                version: Int
                title: String
                status: String
                savedOn: DateTime
            }

            type PbPageListItem {
                id: ID
                editor: String
                status: String
                locked: Boolean
                publishedOn: DateTime
                home: Boolean
                error: Boolean
                notFound: Boolean
                version: Int
                category: PbPageCategory
                title: String
                url: String
                savedOn: DateTime
                createdFrom: ID
                createdOn: DateTime
                createdBy: PbCreatedBy
            }

            type PbPageListMeta {
                page: Int
                limit: Int
                totalCount: Int
                totalPages: Int
                from: Int
                to: Int
                nextPage: Int
                previousPage: Int
            }

            type PbPageSettings {
                _empty: String
            }

            type PbElement {
                id: ID
                name: String
                type: String
                category: String
                content: JSON
                preview: String
            }

            input PbElementInput {
                name: String!
                type: String!
                category: String
                content: JSON!
                preview: RefInput
            }

            input PbUpdateElementInput {
                name: String
                category: String
                content: JSON
                preview: RefInput
            }

            input PbUpdatePageInput {
                title: String
                snippet: String
                category: ID
                url: String
                settings: PbPageSettingsInput
                content: JSON
            }

            input PbPageSettingsInput {
                _empty: String
            }

            type PbPageDeleteResponse {
                data: Boolean
                error: PbError
            }

            type PbPageResponse {
                data: PbPage
                error: PbError
            }

            type PbDeletePageResponseData {
                page: PbPage
                latestPage: PbPage
            }

            type PbDeletePageResponse {
                data: PbDeletePageResponseData
                error: PbError
            }

            type PbPageListResponse {
                data: [PbPageListItem]
                meta: PbPageListMeta
                error: PbError
            }

            type PbElementResponse {
                data: PbElement
                error: PbError
            }

            type PbElementListResponse {
                data: [PbElement]
            }

            type PbSearchTagsResponse {
                data: [String]
            }

            type PbOembedResponse {
                data: JSON
                error: PbError
            }

            enum PbListPagesSortOrders {
                desc
                asc
            }

            enum PbPageStatuses {
                published
                unpublished
                draft
                reviewRequested
                changesRequested
            }

            input PbListPagesSortInput {
                title: PbListPagesSortOrders
                createdOn: PbListPagesSortOrders
            }

            input PbListPagesWhereInput {
                category: String
                status: PbPageStatuses
                tags: [String]
            }

            input PbListPagesSearchInput {
                # By specifying "query", the search will be performed against pages' "title" and "snippet" fields. 
                query: String
            }

            input PbListPublishedPagesWhereInput {
                category: String
                tags: [String]
            }

            enum PbTagsRule {
                ALL
                ANY
            }

            extend type PbQuery {
                getPage(id: ID): PbPageResponse

                getPublishedPage(
                    id: ID
                    url: String
                    returnNotFoundPage: Boolean
                    returnErrorPage: Boolean
                    preview: Boolean
                ): PbPageResponse

                listPages(
                    where: PbListPagesWhereInput
                    limit: Int
                    page: Int
                    sort: PbListPagesSortInput
                    search: PbListPagesSearchInput
                ): PbPageListResponse

                listPublishedPages(
                    where: PbListPublishedPagesWhereInput
                    limit: Int
                    page: Int
                    sort: PbListPagesSortInput
                    search: PbListPagesSearchInput
                ): PbPageListResponse

                listElements(limit: Int): PbElementListResponse

                # Returns existing tags based on given search term.
                searchTags(query: String!): PbSearchTagsResponse

                oembedData(url: String!, width: String, height: String): PbOembedResponse
            }

            extend type PbMutation {
                createPage(from: ID, category: String): PbPageResponse

                # Update page by given ID.
                updatePage(id: ID!, data: PbUpdatePageInput!): PbPageResponse

                # Publish page
                publishPage(id: ID!): PbPageResponse

                # Unpublish page
                unpublishPage(id: ID!): PbPageResponse

                # Signifies that a page needs to be reviewed.
                requestReview(id: ID!): PbPageResponse

                # Signifies that certain changes are needed on given page.
                requestChanges(id: ID!): PbPageResponse

                # Delete page and all of its revisions
                deletePage(id: ID!): PbDeletePageResponse

                # Delete a single revision
                deleteRevision(id: ID!): PbDeleteResponse

                updateImageSize: PbDeleteResponse
            }
        `,
        resolvers: {
            PbPage: {
                category: async (page: { category: string }, args, context) => {
                    return context.pageBuilder.categories.get(page.category);
                },
                revisions: async (page: { id: string }, args, context) => {
                    return context.pageBuilder.pages.listPageRevisions(page.id);
                }
            },
            PbPageListItem: {
                category: async (page: { category: string }, args, context) => {
                    return context.pageBuilder.categories.get(page.category);
                }
            },
            PbQuery: {
                getPage: async (_, args: { id: string }, context) => {
                    const id = decodeURIComponent(args.id);
                    try {
                        return new Response(await context.pageBuilder.pages.get(id));
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                listPages: async (_, args, context) => {
                    try {
                        const [data, meta] = await context.pageBuilder.pages.listLatest(args);
                        return new ListResponse(data, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                listPublishedPages: async (_, args, context) => {
                    try {
                        const [data, meta] = await context.pageBuilder.pages.listPublished(args);
                        return new ListResponse(data, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                getPublishedPage: async (_, args: { id?: string; url?: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.getPublished(args));
                },

                // TODO
                searchTags: async () => null,

                oembedData: async (_, args: { url: string; width?: string; height?: string }) => {
                    try {
                        const provider = findProvider(args.url);
                        if (!provider) {
                            return new ErrorResponse({
                                code: "OEMBED_PROVIDER_NOT_FOUND",
                                message: "OEmbed provider for the requested URL was not found."
                            });
                        }

                        return new Response(await fetchEmbed(args, provider));
                    } catch (e) {
                        return new ErrorResponse({
                            code: "OEMBED_ERROR",
                            message: e.message
                        });
                    }
                }
            },
            PbMutation: {
                createPage: async (_, args: { from?: string; category?: string }, context) => {
                    return resolve(() => {
                        const { from, category } = args;
                        if (!from && !category) {
                            throw new Error(
                                `Cannot create page - you must provide either "from" or "category" input.`
                            );
                        }

                        if (from) {
                            return context.pageBuilder.pages.createFrom(from);
                        }
                        return context.pageBuilder.pages.create(category);
                    });
                },
                deletePage: async (_, args: { id: string }, context: PbContext) => {
                    return resolve(async () => {
                        const id = decodeURIComponent(args.id);
                        const [page, latestPage] = await context.pageBuilder.pages.delete(id);
                        return { page, latestPage };
                    });
                },

                updatePage: async (
                    _,
                    args: { id: string; data: Record<string, any> },
                    context: PbContext
                ) => {
                    return resolve(() => {
                        const { data } = args;
                        const id = decodeURIComponent(args.id);
                        return context.pageBuilder.pages.update(id, data);
                    });
                },

                publishPage: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.publish(args.id));
                },

                unpublishPage: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.unpublish(args.id));
                },

                requestReview: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.requestReview(args.id));
                },

                requestChanges: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.requestChanges(args.id));
                }
            },
            PbPageSettings: {
                _empty: () => ""
            }
        }
    }
};

export default [plugin, pageSettings];
