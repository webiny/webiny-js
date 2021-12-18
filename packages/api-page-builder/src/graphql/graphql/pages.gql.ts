import {
    ListResponse,
    Response,
    ErrorResponse,
    NotFoundResponse
} from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Page, PbContext, PageSecurityPermission } from "~/types";
import Error from "@webiny/error";
import resolve from "./utils/resolve";
import pageSettings from "./pages/pageSettings";
import { fetchEmbed, findProvider } from "./pages/oEmbed";
import lodashGet from "lodash/get";
import checkBasePermissions from "~/graphql/crud/utils/checkBasePermissions";

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
                settings: JSON
            }

            type PbPageListMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Number!
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

            enum PbPageStatuses {
                published
                unpublished
                draft
                reviewRequested
                changesRequested
            }

            enum PbListPagesSort {
                id_ASC
                id_DESC
                savedOn_ASC
                savedOn_DESC
                createdOn_ASC
                createdOn_DESC
                publishedOn_ASC
                publishedOn_DESC
                title_ASC
                title_DESC
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
                    after: String
                    sort: [PbListPagesSort!]
                    search: PbListPagesSearchInput
                ): PbPageListResponse

                listPublishedPages(
                    where: PbListPublishedPagesWhereInput
                    limit: Int
                    after: String
                    sort: [PbListPagesSort!]
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

                # Re-renders given page.
                rerenderPage(id: ID!): PbPageResponse
            }
        `,
        resolvers: {
            PbPage: {
                uniquePageId: async (page: Page) => {
                    const [uniquePageId] = page.id.split("#");
                    return uniquePageId;
                },
                category: async (page: Page, _, context) => {
                    return context.pageBuilder.categories.getCategory(page.category);
                },
                revisions: async (page: Page, _, context) => {
                    return context.pageBuilder.pages.listPageRevisions(page.id);
                },
                url: async (page: Page, _, context) => {
                    const settings = await context.pageBuilder.settings.getCurrentSettings();
                    const websiteUrl = lodashGet(settings, "websiteUrl") || "";
                    return websiteUrl + page.path;
                }
            },
            PbPageListItem: {
                uniquePageId: async (page: Page) => {
                    const [uniquePageId] = page.id.split("#");
                    return uniquePageId;
                },
                category: async (page: Page, _, context) => {
                    return context.pageBuilder.categories.getCategory(page.category, {
                        auth: false
                    });
                },
                url: async (page: Page, _, context) => {
                    const settings = await context.pageBuilder.settings.getCurrentSettings();
                    const websiteUrl = lodashGet(settings, "websiteUrl") || "";
                    return websiteUrl + page.path;
                },
                /**
                 * Tags, snippet and images were saved into Elasticsearch custom field, which does not exist on regular record.
                 * Because of that we need resolvers that either return those properties from the page directly or go deeper to get them.
                 */
                tags: async page => {
                    if (page.tags) {
                        return page.tags;
                    }
                    return lodashGet(page, "settings.general.tags") || [];
                },
                snippet: async page => {
                    if (page.snippet) {
                        return page.snippet;
                    }
                    return lodashGet(page, "settings.general.snippet");
                },
                images: async page => {
                    if (page.images) {
                        return page.images;
                    }
                    return {
                        general: lodashGet(page, "settings.general.image", null)
                    };
                }
            },
            PbQuery: {
                getPage: async (_, args: { id: string }, context) => {
                    try {
                        return new Response(await context.pageBuilder.pages.getPage(args.id));
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                listPages: async (_, args, context) => {
                    try {
                        const [data, meta] = await context.pageBuilder.pages.listLatestPages(args);
                        return new ListResponse(data, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                listPublishedPages: async (_, args, context) => {
                    try {
                        const [data, meta] = await context.pageBuilder.pages.listPublishedPages(
                            args
                        );
                        return new ListResponse(data, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listPageTags: async (_, args: { search: { query: string } }, context) => {
                    return resolve(() => context.pageBuilder.pages.listPagesTags(args));
                },

                getPublishedPage: async (
                    _,
                    args: { id?: string; path?: string; preview?: boolean },
                    context
                ) => {
                    if (args.id) {
                        return resolve(() =>
                            context.pageBuilder.pages.getPublishedPageById({
                                id: args.id,
                                preview: args.preview
                            })
                        );
                    }

                    return resolve(() =>
                        context.pageBuilder.pages.getPublishedPageByPath({
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
                            return context.pageBuilder.pages.createPageFrom(from);
                        }
                        return context.pageBuilder.pages.createPage(category);
                    });
                },
                deletePage: async (_, args: { id: string }, context: PbContext) => {
                    return resolve(async () => {
                        const [page, latestPage] = await context.pageBuilder.pages.deletePage(
                            args.id
                        );
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
                        return context.pageBuilder.pages.updatePage(args.id, data);
                    });
                },

                publishPage: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.publishPage(args.id));
                },

                unpublishPage: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.unpublishPage(args.id));
                },

                requestReview: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.requestPageReview(args.id));
                },

                requestChanges: async (_, args: { id: string }, context) => {
                    return resolve(() => context.pageBuilder.pages.requestPageChanges(args.id));
                },

                rerenderPage: async (_, args: { id: string }, context) => {
                    try {
                        await checkBasePermissions<PageSecurityPermission>(context, "pb.page", {
                            pw: "p"
                        });

                        // If permissions-checks were successful, let's continue with the rest.
                        // Retrieve the original page. If it doesn't exist, immediately exit.
                        const page = await context.pageBuilder.pages.getPage(args.id);
                        if (!page) {
                            console.warn(`no page with id ${args.id}`);
                            return new NotFoundResponse("Page not found.");
                        }

                        // We only need the `id` of the newly created page.
                        await context.pageBuilder.pages.prerendering.render({
                            context,
                            paths: [{ path: page.path }]
                        });

                        return new Response(page);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            PbPageSettings: {
                _empty: () => ""
            }
        }
    }
};

export default [plugin, pageSettings];
