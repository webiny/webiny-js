import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";
const menuFetcher = ctx => ctx.models.PbMenu;
import getMenuBySlug from "./menuResolvers/getMenuBySlug";

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
            getMenu(id: ID, where: JSON, sort: String): PbMenuResponse

            listMenus(
                where: JSON
                sort: JSON
                search: PbSearchInput
                limit: Int
                after: String
                before: String
            ): PbMenuListResponse

            "Returns menu by given slug."
            getMenuBySlug(slug: String!): PbMenuResponse
        }

        extend type PbMutation {
            createMenu(data: PbMenuInput!): PbMenuResponse

            updateMenu(id: ID!, data: PbMenuInput!): PbMenuResponse

            deleteMenu(id: ID!): PbDeleteResponse
        }
    `,
    resolvers: {
        PbQuery: {
            getMenu: hasScope("pb:menu:crud")(resolveGet(menuFetcher)),
            listMenus: hasScope("pb:menu:crud")(resolveList(menuFetcher)),
            getMenuBySlug: getMenuBySlug
        },
        PbMutation: {
            createMenu: hasScope("pb:menu:crud")(resolveCreate(menuFetcher)),
            updateMenu: hasScope("pb:menu:crud")(resolveUpdate(menuFetcher)),
            deleteMenu: hasScope("pb:menu:crud")(resolveDelete(menuFetcher))
        }
    }
};
