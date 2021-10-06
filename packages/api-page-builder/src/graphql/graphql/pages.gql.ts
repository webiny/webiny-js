import { ListResponse, Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Page, PbContext } from "~/types";
import Error from "@webiny/error";
import resolve from "./utils/resolve";
import pageSettings from "./pages/pageSettings";
import { fetchEmbed, findProvider } from "./pages/oEmbed";
import get from "lodash/get";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbPageCategory {
                slug: String
                name: String
                url: String
            }

            type PbPageVisibilitySettings {
                published: Boolean
                latest: Boolean
            }

            type PbPageVisibility {
                get: PbPageVisibilitySettings
                list: PbPageVisibilitySettings
            }

            type PbPage {
                id: ID
                pid: ID
                uniquePageId: ID
                editor: String
                createdFrom: ID
                createdBy: PbCreatedBy
                createdOn: DateTime
                savedOn: DateTime
                publishedOn: DateTime
                locked: Boolean
                category: PbPageCategory
                version: Int
                title: String
                status: String
                visibility: PbPageVisibility
                path: String
                url: String
                settings: PbPageSettings
                content: JSON
                revisions: [PbPageRevision]
            }

            type PbPageRevision {
                id: ID
                pid: ID
                version: Int
                title: String
                status: String
                locked: Boolean
                savedOn: DateTime
            }

            type PbPageListItemImages {
                general: PbFile
            }

            type PbPageListItem {
                id: ID
                pid: ID
                uniquePageId: ID
                editor: String
                status: String
                locked: Boolean
                publishedOn: DateTime
                images: PbPageListItemImages
                version: Int
                category: PbPageCategory
                title: String
                snippet: String
                tags: [String]
                path: String
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

            input PbPageVisibilitySettingsInput {
                published: Boolean
                latest: Boolean
            }

            input PbPageVisibilityInput {
                get: PbPageVisibilitySettingsInput
                list: PbPageVisibilitySettingsInput
            }

            input PbUpdatePageInput {
                title: String
                category: ID
                path: String
                visibility: PbPageVisibilityInput
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

            type PbSearchTagsResponse {
                data: [String]
            }

            type PbOembedResponse {
                data: JSON
                error: PbError
            }

            type PbPageTagsListResponse {
                data: [String]
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
                publishedOn: PbListPagesSortOrders
            }

            input PbListPagesWhereInput {
                category: String
                status: PbPageStatuses
                tags: PbListPagesWhereTagsInput
            }

            input PbListPagesSearchInput {
                # By specifying "query", the search will be performed against pages' "title" and "snippet" fields.
                query: String
            }

            enum PbTagsRule {
                all
                any
            }

            input PbListPagesWhereTagsInput {
                query: [String]
                rule: PbTagsRule
            }

            input PbListPublishedPagesWhereInput {
                category: String
                tags: PbListPagesWhereTagsInput
            }

            input PbListPageTagsSearchInput {
                query: String!
            }

            extend type PbQuery {
                getPage(id: ID): PbPageResponse

                getPublishedPage(
                    id: ID
                    path: String
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
                    exclude: [String]
                ): PbPageListResponse

                listPageTags(search: PbListPageTagsSearchInput!): PbPageTagsListResponse

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
                uniquePageId: async (page: Page) => {
                    const [uniquePageId] = page.id.split("#");
                    return uniquePageId;
                },
                category: async (page: Page, args, context) => {
                    return context.pageBuilder.categories.get(page.category);
                },
                revisions: async (page: Page, args, context) => {
                    return context.pageBuilder.pages.listPageRevisions(page.id);
                },
                url: async (page: Page, args, context) => {
                    const settings = await context.pageBuilder.settings.default.getCurrent();
                    const websiteUrl = get(settings, "websiteUrl") || "";
                    return websiteUrl + page.path;
                }
            },
            PbPageListItem: {
                uniquePageId: async (page: Page) => {
                    const [uniquePageId] = page.id.split("#");
                    return uniquePageId;
                },
                category: async (page: Page, args, context) => {
                    return context.pageBuilder.categories.get(page.category, { auth: false });
                },
                url: async (page: Page, args, context) => {
                    const settings = await context.pageBuilder.settings.default.getCurrent();
                    const websiteUrl = get(settings, "websiteUrl") || "";
                    return websiteUrl + page.path;
                }
            },
            PbQuery: {
                getPage: async (_, args: { id: string }, context) => {
                    try {
                        return new Response(await context.pageBuilder.pages.get(args.id));
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
                listPageTags: async (_, args: { search: { query: string } }, context) => {
                    return resolve(() => context.pageBuilder.pages.listTags(args));
                },

                getPublishedPage: async (
                    _,
                    args: { id?: string; path?: string; preview?: boolean },
                    context
                ) => {
                    if (args.id) {
                        return resolve(() =>
                            context.pageBuilder.pages.getPublishedById({
                                id: args.id,
                                preview: args.preview
                            })
                        );
                    }

                    return resolve(() =>
                        context.pageBuilder.pages.getPublishedByPath({
                            path: args.path
                        })
                    );
                },

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
                        const [page, latestPage] = await context.pageBuilder.pages.delete(args.id);
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
                        return context.pageBuilder.pages.update(args.id, data);
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
