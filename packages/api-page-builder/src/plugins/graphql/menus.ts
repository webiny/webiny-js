import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { Response, NotFoundResponse } from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";
import pipe from "@ramda/pipe";

const hasRwd = ({ pbMenuPermission, rwd }) => {
    if (typeof pbMenuPermission.rwd !== "string") {
        return true;
    }

    return pbMenuPermission.rwd.includes(rwd);
};

type Context = HandlerContext<HandlerI18NContext, SecurityContext>;

export default {
    typeDefs: /* GraphQL */ `
        type PbMenu {
            id: ID
            createdOn: DateTime
            createdBy: PbCreatedBy
            title: String
            slug: String
            description: String
            items: JSON
        }

        input PbMenuInput {
            id: ID
            title: String
            slug: String
            description: String
            items: JSON
        }

        # Response types
        type PbMenuResponse {
            data: PbMenu
            error: PbError
        }

        type PbMenuListResponse {
            data: [PbMenu]
            error: PbError
        }

        extend type PbQuery {
            getMenu(slug: String!): PbMenuResponse
            listMenus: PbMenuListResponse

            "Returns menu by given slug."
            getMenuBySlug(slug: String!): PbMenuResponse
        }

        extend type PbMutation {
            createMenu(data: PbMenuInput!): PbMenuResponse
            updateMenu(slug: String!, data: PbMenuInput!): PbMenuResponse
            deleteMenu(slug: String!): PbMenuResponse
        }
    `,
    resolvers: {
        PbQuery: {
            getMenu: pipe(
                hasPermission("pb.menu"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "r" is not part of it, bail.
                const pbMenuPermission = await context.security.getPermission("pb.menu");
                if (pbMenuPermission && !hasRwd({ pbMenuPermission, rwd: "r" })) {
                    return new NotAuthorizedResponse();
                }

                const { menus } = context;
                const menu = await menus.get(args.slug);
                if (!menu) {
                    return new NotFoundResponse(`Menu "${args.slug}" not found.`);
                }

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbMenuPermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (menu.createdBy.id !== identity.id) {
                        return new NotAuthorizedResponse();
                    }
                }

                return new Response(menu);
            }),
            listMenus: pipe(
                hasPermission("pb.menu"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "r" is not part of it, bail.
                const pbMenuPermission = await context.security.getPermission("pb.menu");
                if (pbMenuPermission && !hasRwd({ pbMenuPermission, rwd: "r" })) {
                    return new NotAuthorizedResponse();
                }

                const { menus } = context;

                let list = await menus.list();

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbMenuPermission?.own === true) {
                    const identity = context.security.getIdentity();
                    list = list.filter(menu => menu.createdBy.id === identity.id);
                }

                return new Response(list);
            })
        },
        PbMutation: {
            createMenu: pipe(
                hasPermission("pb.menu"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbMenuPermission = await context.security.getPermission("pb.menu");
                if (pbMenuPermission && !hasRwd({ pbMenuPermission, rwd: "w" })) {
                    return new NotAuthorizedResponse();
                }

                const { menus } = context;
                const { data } = args;

                if (await menus.get(data.slug)) {
                    return new NotFoundResponse(`Menu with slug "${data.slug}" already exists.`);
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

                await menus.create(newData);

                return new Response(newData);
            }),
            updateMenu: pipe(
                hasPermission("pb.menu"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbMenuPermission = await context.security.getPermission("pb.menu");
                if (pbMenuPermission && !hasRwd({ pbMenuPermission, rwd: "w" })) {
                    return new NotAuthorizedResponse();
                }

                const { menus } = context;
                const { slug, data } = args;

                let menu = await menus.get(slug);
                if (!menu) {
                    return new NotFoundResponse(`Menu "${slug}" not found.`);
                }

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbMenuPermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (menu.createdBy.id !== identity.id) {
                        return new NotAuthorizedResponse();
                    }
                }

                await menus.update(data);

                menu = await menus.get(slug);
                return new Response(menu);
            }),
            deleteMenu: pipe(
                hasPermission("pb.menu"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "d" is not part of it, bail.
                const pbMenuPermission = await context.security.getPermission("pb.menu");
                if (pbMenuPermission && !hasRwd({ pbMenuPermission, rwd: "d" })) {
                    return new NotAuthorizedResponse();
                }

                const { menus } = context;
                const { slug } = args;

                const menu = await menus.get(slug);
                if (!menu) {
                    return new NotFoundResponse(`Menu "${args.slug}" not found.`);
                }

                // If user can only manage own records, let's check if he owns the loaded one.
                if (pbMenuPermission?.own === true) {
                    const identity = context.security.getIdentity();
                    if (menu.createdBy.id !== identity.id) {
                        return new NotAuthorizedResponse();
                    }
                }

                await menus.delete(slug);

                return new Response(menu);
            })
        }
    }
};
