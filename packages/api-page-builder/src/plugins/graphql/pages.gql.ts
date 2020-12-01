import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import createRevisionFrom from "./pageResolvers/createRevisionFrom";
import oembed from "./pageResolvers/oembed";
import { compose } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { Context as HandlerContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";
import { Response, NotFoundResponse, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PagesListArgs } from "@webiny/api-page-builder/plugins/crud/pages.crud";

const hasRwd = ({ pbPagePermission, rwd }) => {
    if (typeof pbPagePermission.rwd !== "string") {
        return true;
    }

    return pbPagePermission.rwd.includes(rwd);
};

type Context = HandlerContext<I18NContext, SecurityContext>;

const plugin: GraphQLSchemaPlugin<Context> = {
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

            type PbPageListResponse {
                data: [PbPageListItem]
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

            input PbOEmbedInput {
                url: String!
                width: Int
                height: Int
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
                ): PbPageListResponse

                listPublishedPages(sort: PbListPagesSortInput): PbPageListResponse

                listElements(limit: Int): PbElementListResponse

                # Returns existing tags based on given search term.
                searchTags(query: String!): PbSearchTagsResponse

                oembedData(url: String!, width: String, height: String): PbOembedResponse
            }

            extend type PbMutation {
                createPage(from: ID, category: String): PbPageResponse

                # Create a new revision from an existing revision
                createRevisionFrom(revision: ID!): PbPageResponse

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
                deletePage(id: ID!): PbPageResponse

                # Delete a single revision
                deleteRevision(id: ID!): PbDeleteResponse

                updateImageSize: PbDeleteResponse
            }
        `,
        resolvers: {
            PbPage: {
                category: async (page: { category: string }, args, context) => {
                    const { categories } = context;
                    return categories.get(page.category);
                },
                revisions: async (page: { id: string }, args, context) => {
                    const { pages } = context;
                    return pages.listRevisionsForPage(page.id);
                }
            },
            PbPageListItem: {
                category: async (page: { category: string }, args, context) => {
                    const { categories } = context;
                    return categories.get(page.category);
                }
            },
            PbQuery: {
                getPage: compose(
                    hasPermission("pb.page"),
                    hasI18NContentPermission()
                )(async (_, args: { id: string }, context: Context) => {
                    // If permission has "rwd" property set, but "r" is not part of it, bail.
                    const pbPagePermission = await context.security.getPermission("pb.page");
                    if (!hasRwd({ pbPagePermission, rwd: "r" })) {
                        return new NotAuthorizedResponse();
                    }

                    const id = decodeURIComponent(args.id);

                    const { pages } = context;
                    const page = await pages.get(id);
                    if (!page) {
                        return new NotFoundResponse(`Page "${id}" not found.`);
                    }

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbPagePermission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (page.createdBy.id !== identity.id) {
                            return new NotAuthorizedResponse();
                        }
                    }

                    return new Response(page);
                }),

                listPages: async (_, args: PagesListArgs, context) => {
                    try {
                        const { pages } = context;
                        const list = await pages.listLatest(args);
                        return new Response(list);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                listPublishedPages: async (_, args, context) => {
                    try {
                        const { pages } = context;
                        const list = await pages.listPublished(args);
                        return new Response(list);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getPublishedPage: async (_, args: { id?: string; url?: string }, context) => {
                    const { pages } = context;
                    const page = await pages.getPublished(args);
                    if (!page) {
                        return new NotFoundResponse(`Page "${args.id}" not found.`);
                    }
                    return new Response(page);
                },
                searchTags: async (
                    root: any,
                    args: { [key: string]: any },
                    context: { [key: string]: any },
                    info: { [key: string]: any }
                ) => {
                    const resolver = context.plugins.byName("pb-resolver-search-tags");

                    return { data: await resolver.resolve({ root, args, context, info }) };
                },
                oembedData: hasPermission("pb:oembed:read")(oembed)
            },
            PbMutation: {
                createPage: compose(
                    hasPermission("pb.page"),
                    hasI18NContentPermission()
                )(async (_, args: { from?: string; category?: string }, context: Context) => {
                    const { pages } = context;
                    const { from, category } = args;

                    try {
                        if (from) {
                            return new Response(await pages.createFrom({ from }));
                        } else {
                            return new Response(await pages.create({ category }));
                        }
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }),
                deletePage: compose(
                    hasPermission("pb.page"),
                    hasI18NContentPermission()
                )(async (_, args: { id: string }, context: Context) => {
                    // If permission has "rwd" property set, but "d" is not part of it, bail.
                    const pbPagePermission = await context.security.getPermission("pb.page");
                    if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "d" })) {
                        return new NotAuthorizedResponse();
                    }

                    const { pages } = context;
                    const id = decodeURIComponent(args.id);

                    const page = await pages.get(id);
                    if (!page) {
                        return new NotFoundResponse(`Page "${args.id}" not found.`);
                    }

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbPagePermission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (page.createdBy.id !== identity.id) {
                            return new NotAuthorizedResponse();
                        }
                    }

                    await pages.delete(id);

                    return new Response(page);
                }),

                createRevisionFrom: hasPermission("pb:page:crud")(createRevisionFrom),

                updatePage: compose(
                    hasPermission("pb.page"),
                    hasI18NContentPermission()
                )(async (_, args: { id: string; data: Record<string, any> }, context: Context) => {
                    const { pages } = context;
                    const { data } = args;
                    const id = decodeURIComponent(args.id);

                    try {
                        const page = await pages.update(id, data);
                        return new Response(page);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }),

                publishPage: async (_, args: { id: string }, context) => {
                    const { pages } = context;
                    try {
                        const page = await pages.publish(args.id);
                        return new Response(page);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                unpublishPage: async (_, args: { id: string }, context) => {
                    const { pages } = context;
                    try {
                        const page = await pages.unpublish(args.id);
                        return new Response(page);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                requestReview: async (_, args: { id: string }, context) => {
                    const { pages } = context;
                    try {
                        const page = await pages.requestReview(args.id);
                        return new Response(page);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },

                requestChanges: async (_, args: { id: string }, context) => {
                    const { pages } = context;
                    try {
                        const page = await pages.requestChanges(args.id);
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

export default plugin;
