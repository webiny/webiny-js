// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/api/graphql";

const menuFetcher = ctx => ctx.getEntity("PbMenu");
import getMenuBySlug from "./menuResolvers/getMenuBySlug";

export default {
    typeDefs: `
        type PbMenu {
            id: ID
            createdOn: DateTime
            title: String
            slug: String
            description: String
            items: JSON
        }
    
        input PbMenuInput {
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
            getMenu(
                id: ID 
                where: JSON
                sort: String
            ): PbMenuResponse
            
            listMenus(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: PbSearchInput
            ): PbMenuListResponse
            
            "Returns menu by given slug."
            getMenuBySlug(
                slug: String!
            ): PbMenuResponse
        }
        
        extend type PbMutation {
            createMenu(
                data: PbMenuInput!
            ): PbMenuResponse
            
            updateMenu(
                id: ID!
                data: PbMenuInput!
            ): PbMenuResponse
        
            deleteMenu(
                id: ID!
            ): PbDeleteResponse
        }
    `,
    resolvers: {
       PbQuery: {
            getMenu: resolveGet(menuFetcher),
            listMenus: resolveList(menuFetcher),
            getMenuBySlug: getMenuBySlug(menuFetcher)
        },
       PbMutation: {
            createMenu: resolveCreate(menuFetcher),
            updateMenu: resolveUpdate(menuFetcher),
            deleteMenu: resolveDelete(menuFetcher)
        }
    }
};
