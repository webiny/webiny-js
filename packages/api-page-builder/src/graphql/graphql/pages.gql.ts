import {
    ListResponse,
    Response,
    ErrorResponse,
    NotFoundResponse
} from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Page, PbContext, PageContentWithTemplate } from "~/types";
import WebinyError from "@webiny/error";
import resolve from "./utils/resolve";
import { createPageSettingsGraphQL } from "./pages/pageSettings";
import { fetchEmbed, findProvider } from "./pages/oEmbed";
import lodashGet from "lodash/get";
import { PagesPermissions } from "~/graphql/crud/permissions/PagesPermissions";

function hasTemplate(content: Page["content"]): content is PageContentWithTemplate {
    return content?.data?.template;
}

const createBasePageGraphQL = (): GraphQLSchemaPlugin<PbContext> => {
    return {
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

                input PbUpdatePageInput {
                    title: String
                    category: ID
                    path: String
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
                    pid_in: [ID!]
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
                    createPage(from: ID, category: String, meta: JSON): PbPageResponse

                    # Update page by given ID.
                    updatePage(id: ID!, data: PbUpdatePageInput!): PbPageResponse

                    # Duplicate page by given ID.
                    duplicatePage(id: ID!, meta: JSON): PbPageResponse

                    unlinkPageFromTemplate(id: ID!): PbPageResponse

                    # Publish page
                    publishPage(id: ID!): PbPageResponse

                    # Unpublish page
                    unpublishPage(id: ID!): PbPageResponse

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
                        return context.pageBuilder.getCategory(page.category);
                    },
                    revisions: async (page: Page, _, context) => {
                        return context.pageBuilder.listPageRevisions(page.id);
                    },
                    url: async (page: Page, _, context) => {
                        const settings = await context.pageBuilder.getCurrentSettings();
                        const websiteUrl = lodashGet(settings, "websiteUrl") || "";
                        return websiteUrl + page.path;
                    },
                    content: async (page: Page, _, context) => {
                        if (!page.content?.elements) {
                            return page.content;
                        }

                        let blocks;

                        if (hasTemplate(page.content)) {
                            blocks = await context.pageBuilder.resolvePageTemplate(page.content);
                        } else {
                            blocks = await context.pageBuilder.resolvePageBlocks(page.content);
                        }

                        // Run element processors on the full page content for potential transformations.
                        const processedPage = await context.pageBuilder.processPageContent({
                            ...page,
                            content: { ...page.content, elements: blocks }
                        });

                        return processedPage.content;
                    }
                },
                PbPageListItem: {
                    uniquePageId: async (page: Page) => {
                        const [uniquePageId] = page.id.split("#");
                        return uniquePageId;
                    },
                    category: async (page: Page, _, context) => {
                        return context.pageBuilder.getCategory(page.category, {
                            auth: false
                        });
                    },
                    url: async (page: Page, _, context) => {
                        const settings = await context.pageBuilder.getCurrentSettings();
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
                    getPage: async (_, args: any, context) => {
                        try {
                            return new Response(await context.pageBuilder.getPage(args.id));
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },

                    listPages: async (_, args: any, context) => {
                        try {
                            const [data, meta] = await context.pageBuilder.listLatestPages(args);
                            return new ListResponse(data, meta);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },

                    listPublishedPages: async (_, args: any, context) => {
                        try {
                            const [data, meta] = await context.pageBuilder.listPublishedPages(args);
                            return new ListResponse(data, meta);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },
                    listPageTags: async (_, args: any, context) => {
                        return resolve(() => context.pageBuilder.listPagesTags(args));
                    },

                    getPublishedPage: async (
                        _,
                        args: {
                            id?: string;
                            path?: string;
                            preview?: boolean;
                            returnNotFoundPage?: boolean;
                        },
                        context
                    ) => {
                        if (args.id) {
                            return resolve(() =>
                                context.pageBuilder.getPublishedPageById({
                                    id: args.id as string,
                                    preview: args.preview
                                })
                            );
                        }

                        return resolve(async () => {
                            try {
                                return await context.pageBuilder.getPublishedPageByPath({
                                    path: args.path as string
                                });
                            } catch (err) {
                                if (args.returnNotFoundPage === true && err.code === "NOT_FOUND") {
                                    // Load NOT FOUND page from settings
                                    const settings = await context.pageBuilder.getCurrentSettings();
                                    if (!settings.pages?.notFound) {
                                        return null;
                                    }
                                    return context.pageBuilder.getPublishedPageById({
                                        id: settings.pages.notFound
                                    });
                                }
                                throw err;
                            }
                        });
                    },

                    oembedData: async (_, args: any) => {
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
                    createPage: async (
                        _,
                        args: { from?: string; category?: string; meta?: Record<string, any> },
                        context
                    ) => {
                        return resolve(() => {
                            const { from, category, meta } = args;
                            if (!from && !category) {
                                throw new WebinyError(
                                    `Cannot create page - you must provide either "from" or "category" input.`
                                );
                            }

                            if (from) {
                                return context.pageBuilder.createPageFrom(from, meta);
                            }
                            /**
                             * We can safely cast because we check for category existence in the beginning of the fn
                             */
                            return context.pageBuilder.createPage(category as string, meta);
                        });
                    },

                    deletePage: async (_, args: any, context) => {
                        return resolve(async () => {
                            const [page, latestPage] = await context.pageBuilder.deletePage(
                                args.id
                            );
                            return { page, latestPage };
                        });
                    },

                    updatePage: async (_, args: any, context) => {
                        return resolve(() => {
                            const { data } = args;
                            return context.pageBuilder.updatePage(args.id, data);
                        });
                    },

                    duplicatePage: async (_, args: any, context) => {
                        try {
                            const { id, meta } = args;
                            const page = await context.pageBuilder.getPage(id);
                            const { id: duplicatedPageId } = await context.pageBuilder.createPage(
                                page.category,
                                meta
                            );

                            const duplicatedPageData = {
                                title: `${page.title} (Copy)`,
                                path: `${page.path}-copy`,
                                content: page.content,
                                settings: page.settings
                            };

                            return new Response(
                                await context.pageBuilder.updatePage(
                                    duplicatedPageId,
                                    duplicatedPageData
                                )
                            );
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },

                    unlinkPageFromTemplate: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.unlinkPageFromTemplate(args.id);
                        });
                    },

                    publishPage: async (_, args: any, context) => {
                        return resolve(() => context.pageBuilder.publishPage(args.id));
                    },

                    unpublishPage: async (_, args: any, context) => {
                        return resolve(() => context.pageBuilder.unpublishPage(args.id));
                    },

                    rerenderPage: async (_, args: any, context) => {
                        try {
                            const pagesPermissions = new PagesPermissions({
                                getIdentity: context.security.getIdentity,
                                getPermissions: () => context.security.getPermissions("pb.page"),
                                fullAccessPermissionName: "pb.*"
                            });

                            await pagesPermissions.ensure({ pw: "p" });

                            // If permissions-checks were successful, let's continue with the rest.
                            // Retrieve the original page. If it doesn't exist, immediately exit.
                            const page = await context.pageBuilder.getPage(args.id);
                            if (!page) {
                                console.warn(`no page with id ${args.id}`);
                                return new NotFoundResponse("Page not found.");
                            }

                            // We only need the `id` of the newly created page.
                            await context.pageBuilder.prerendering.render({
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
};

export const createPageGraphQL = (): GraphQLSchemaPlugin<PbContext>[] => {
    return [createBasePageGraphQL(), ...createPageSettingsGraphQL()];
};
