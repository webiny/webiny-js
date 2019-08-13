// @flow
import {
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "webiny-api/graphql";

const menuFetcher = ctx => ctx.getEntity("CmsMenu");
import getMenuBySlug from "./menuResolvers/getMenuBySlug";

export default {
    typeDefs: `
        type PageBuilderMenu {
            id: ID
            createdOn: DateTime
            title: String
            slug: String
            description: String
            items: JSON
        }
    
        input PageBuilderMenuInput {
            title: String
            slug: String
            description: String
            items: JSON
        }
        
        # Response types
        
        type PageBuilderMenuResponse {
            data: PageBuilderMenu
            error: PageBuilderError
        }
        
        type PageBuilderMenuListResponse {
            data: [PageBuilderMenu]
            meta: PageBuilderListMeta
            error: PageBuilderError
        }
            
        extend type PageBuilderQuery {
            getMenu(
                id: ID 
                where: JSON
                sort: String
            ): PageBuilderMenuResponse
            
            listMenus(
                page: Int
                perPage: Int
                where: JSON
                sort: JSON
                search: PageBuilderSearchInput
            ): PageBuilderMenuListResponse
            
            "Returns menu by given slug."
            getMenuBySlug(
                slug: String!
            ): PageBuilderMenuResponse
        }
        
        extend type PageBuilderMutation {
            createMenu(
                data: PageBuilderMenuInput!
            ): PageBuilderMenuResponse
            
            updateMenu(
                id: ID!
                data: PageBuilderMenuInput!
            ): PageBuilderMenuResponse
        
            deleteMenu(
                id: ID!
            ): PageBuilderDeleteResponse
        }
    `,
    resolvers: {
        PageBuilderQuery: {
            getMenu: resolveGet(menuFetcher),
            listMenus: resolveList(menuFetcher),
            getMenuBySlug: getMenuBySlug(menuFetcher)
        },
        PageBuilderMutation: {
            createMenu: resolveCreate(menuFetcher),
            updateMenu: resolveUpdate(menuFetcher),
            deleteMenu: resolveDelete(menuFetcher)
        }
    }
};
