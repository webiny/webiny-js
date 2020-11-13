import { GraphQLFieldResolver } from "graphql";
import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import createRevisionFrom from "./pageResolvers/createRevisionFrom";
import listPublishedPages from "./pageResolvers/listPublishedPages";
import getPublishedPage from "./pageResolvers/getPublishedPage";
import setHomePage from "./pageResolvers/setHomePage";
import oembed from "./pageResolvers/oembed";
import pipe from "@ramda/pipe";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";
import { Response, NotFoundResponse, ErrorResponse } from "@webiny/graphql";
import uniqid from "uniqid";

const pageFetcher = ctx => ctx.models.PbPage;
const elementFetcher = ctx => ctx.models.PbPageElement;

const publishRevision: GraphQLFieldResolver<any, any> = (_, args, ctx, info) => {
    args.data = { published: true };

    return resolveUpdate(pageFetcher)(_, args, ctx, info);
};

type Context = HandlerContext<HandlerI18NContext, SecurityContext>;

const hasRwd = ({ pbPagePermission, rwd }) => {
    if (typeof pbPagePermission.rwd !== "string") {
        return true;
    }

    return pbPagePermission.rwd.includes(rwd);
};

export default {
    typeDefs: /* GraphQL */ `
        type PbPageCategory {
            slug: String
            name: String
            url: String
        }

        type PbPage {
            id: ID
            createdBy: PbCreatedBy
            createdOn: DateTime
            savedOn: DateTime
            publishedOn: DateTime
            category: PbPageCategory
            version: Int
            title: String
            status: String
            snippet: String
            url: String
            fullUrl: String
            settings: PbPageSettings
            content: JSON
            published: Boolean
            # isHomePage: Boolean
            # isErrorPage: Boolean
            # isNotFoundPage: Boolean
            locked: Boolean
            parent: ID
        }

        type PbPageListItem {
            id: ID
            createdOn: DateTime
            savedOn: DateTime
            createdBy: PbCreatedBy
            published: Boolean
            category: PbPageCategory
            title: String
            url: String
            status: String
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

        input PbCreatePageInput {
            category: String!
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

        input PbPageSortInput {
            title: Int
            publishedOn: Int
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
                parent: ID
                returnNotFoundPage: Boolean
                returnErrorPage: Boolean
                preview: Boolean
            ): PbPageResponse

            listPages(sort: JSON, limit: Int): PbPageListResponse

            listPublishedPages(
                search: String
                category: String
                parent: String
                tags: [String]
                tagsRule: PbTagsRule
                sort: PbPageSortInput
                limit: Int
                after: String
                before: String
            ): PbPageListResponse

            listElements(limit: Int): PbElementListResponse

            # Returns existing tags based on given search term.
            searchTags(query: String!): PbSearchTagsResponse

            oembedData(url: String!, width: String, height: String): PbOembedResponse
        }

        extend type PbMutation {
            createPage(data: PbCreatePageInput!): PbPageResponse

            # Sets given page as new homepage.
            setHomePage(id: ID!): PbPageResponse

            # Create a new revision from an existing revision
            createRevisionFrom(revision: ID!): PbPageResponse

            # Update page by given ID.
            updatePage(id: ID!, data: PbUpdatePageInput!): PbPageResponse

            # Publish revision
            publishRevision(id: ID!): PbPageResponse

            # Delete page and all of its revisions
            deletePage(id: ID!): PbPageResponse

            # Delete a single revision
            deleteRevision(id: ID!): PbDeleteResponse

            # Create element
            createElement(data: PbElementInput!): PbElementResponse

            updateElement(id: ID!, data: PbUpdateElementInput!): PbElementResponse

            # Delete element
            deleteElement(id: ID!): PbDeleteResponse

            updateImageSize: PbDeleteResponse
        }
    `,
    resolvers: {
        PbPage: {
            category: async (page, args, context) => {
                const { categories } = context;
                return categories.get(page.category);
            }
        },
        PbPageListItem: {
            category: async (page, args, context) => {
                const { categories } = context;
                return categories.get(page.category);
            }
        },
        PbQuery: {
            getPage: pipe(
                hasPermission("pb.page"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "r" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "r" })) {
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

            listPages: pipe(
                hasPermission("pb.page"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "r" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "r" })) {
                    return new NotAuthorizedResponse();
                }

                const { pages } = context;
                const list = await pages.list(args);
                return new Response(list);
            }),

            listPublishedPages,
            getPublishedPage,
            listElements: hasPermission("pb:element:crud")(elementFetcher),
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
            createPage: pipe(
                hasPermission("pb.page"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    return new NotAuthorizedResponse();
                }

                const { pages, categories } = context;
                const { data } = args;

                const existingCategory = await categories.get(data.category);
                if (!existingCategory) {
                    return new NotFoundResponse(`Category with slug "${data.category}" not found.`);
                }

                try {
                    return new Response(
                        await pages.create({
                            category: data.category,
                            title: "Untitled",
                            url: existingCategory.url + "untitled-" + uniqid.time()
                        })
                    );
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }),
            deletePage: pipe(
                hasPermission("pb.page"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
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

            setHomePage,
            createRevisionFrom: hasPermission("pb:page:crud")(createRevisionFrom),

            updatePage: pipe(
                hasPermission("pb.page"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    return new NotAuthorizedResponse();
                }

                const { pages } = context;
                const { data } = args;
                const id = decodeURIComponent(args.id);

                let page = await pages.get(id);
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

                try {
                    await pages.update(id, data);
                    page = await pages.get(id);
                    return new Response(page);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }),
            publishRevision: hasPermission("pb:page:crud")(publishRevision),
            deleteRevision: hasPermission("pb:page:crud")(pageFetcher),

            createElement: hasPermission("pb:page:crud")(elementFetcher),
            updateElement: hasPermission("pb:page:crud")(elementFetcher),
            deleteElement: hasPermission("pb:page:crud")(elementFetcher)
        },
        PbPageSettings: {
            _empty: () => ""
        }
    }
};
