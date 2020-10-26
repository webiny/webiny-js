import { hasScope } from "@webiny/api-security";
import { Response, NotFoundResponse } from "@webiny/graphql";

export default {
    typeDefs: /* GraphQL */ `
        type PbMenu {
            id: ID
            createdOn: DateTime
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
            meta: PbListMeta
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
            getMenu: hasScope("pb.menu")(async (_, args, context) => {
                const { menus } = context;
                const menu = await menus.get(args.slug);
                if (!menu) {
                    return new NotFoundResponse(`Menu "${args.slug}" not found.`);
                }

                return new Response(menu);
            }),
            listMenus: hasScope("pb.menu")(async (_, args, context) => {
                const { menus } = context;
                return new Response(await menus.list());
            })
        },
        PbMutation: {
            createMenu: hasScope("pb.menu")(async (_, args, context) => {
                const { menus } = context;
                const { data } = args;

                if (await menus.get(data.slug)) {
                    return new NotFoundResponse(`Menu with slug "${data.slug}" already exists.`);
                }

                await menus.create(data);
                return new Response(data);
            }),
            updateMenu: hasScope("pb.menu")(async (_, args, context) => {
                const { menus } = context;
                const { slug, data } = args;

                let menu = await menus.get(slug);
                if (!menu) {
                    return new NotFoundResponse(`Menu "${slug}" not found.`);
                }

                await menus.update(data);

                menu = await menus.get(slug);
                return new Response(menu);
            }),
            deleteMenu: hasScope("pb.menu")(async (_, args, context) => {
                const { menus } = context;
                const { slug } = args;

                const menu = await menus.get(slug);
                if (!menu) {
                    return new NotFoundResponse(`Menu "${args.slug}" not found.`);
                }

                await menus.delete(slug);

                return new Response(menu);
            })
        }
    }
};
