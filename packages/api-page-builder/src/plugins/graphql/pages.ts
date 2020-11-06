import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { Response, NotFoundResponse } from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";
import pipe from "@ramda/pipe";

const hasRwd = ({ pbPagePermission, rwd }) => {
    if (typeof pbPagePermission.rwd !== "string") {
        return true;
    }

    return pbPagePermission.rwd.includes(rwd);
};

type Context = HandlerContext<HandlerI18NContext, SecurityContext>;

export default {
    typeDefs: /* GraphQL */ `
        type PbPageCreatedBy {
            id: ID
            displayName: String
        }

        type PbPage {
            id: ID
            createdOn: DateTime
            createdBy: PbPageCreatedBy
            title: String
            slug: String
            description: String
            items: JSON
        }

        input PbPageInput {
            id: ID
            title: String
            slug: String
            description: String
            items: JSON
        }

        # Response types
        type PbPageResponse {
            data: PbPage
            error: PbError
        }

        type PbPageListResponse {
            data: [PbPage]
            meta: PbListMeta
            error: PbError
        }

        extend type PbQuery {
            getPage(slug: String!): PbPageResponse
            listPages: PbPageListResponse

            "Returns page by given slug."
            getPageBySlug(slug: String!): PbPageResponse
        }

        extend type PbMutation {
            createPage(data: PbPageInput!): PbPageResponse
            updatePage(slug: String!, data: PbPageInput!): PbPageResponse
            deletePage(slug: String!): PbPageResponse
        }
    `,
    resolvers: {
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

                const { pages } = context;
                const page = await pages.get(args.slug);
                if (!page) {
                    return new NotFoundResponse(`Page "${args.slug}" not found.`);
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

                let list = await pages.list();

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    list = list.filter(page => page.createdBy.id === identity.id);
                }

                return new Response(list);
            })
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

                const { pages } = context;
                const { data } = args;

                if (await pages.get(data.slug)) {
                    return new NotFoundResponse(`Page with slug "${data.slug}" already exists.`);
                }

                const identity = context.security.getIdentity();

                const newData = {
                    ...data,
                    locale: context.i18nContent.locale,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName
                    }
                };

                await pages.create(newData);

                return new Response(newData);
            }),
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
                const { slug, data } = args;

                let page = await pages.get(slug);
                if (!page) {
                    return new NotFoundResponse(`Page "${slug}" not found.`);
                }

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (page.createdBy.id !== identity.id) {
                        return new NotAuthorizedResponse();
                    }
                }

                await pages.update(data);

                page = await pages.get(slug);
                return new Response(page);
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
                const { slug } = args;

                const page = await pages.get(slug);
                if (!page) {
                    return new NotFoundResponse(`Page "${args.slug}" not found.`);
                }

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbPagePermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (page.createdBy.id !== identity.id) {
                        return new NotAuthorizedResponse();
                    }
                }

                await pages.delete(slug);

                return new Response(page);
            })
        }
    }
};
