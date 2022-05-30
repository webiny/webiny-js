import { createBaseGraphQL } from "./graphql/base.gql";
import { createMenuGraphQL } from "./graphql/menus.gql";
import { createPageGraphQL } from "./graphql/pages.gql";
import { createPageElementsGraphQL } from "./graphql/pageElements.gql";
import { createCategoryGraphQL } from "./graphql/categories.gql";
import { createSettingsGraphQL } from "./graphql/settings.gql";
import { createInstallGraphQL } from "./graphql/install.gql";
import { createBlockCategoryGraphQL } from "./graphql/blockCategories.gql";

import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export default () => {
    return [
        createBaseGraphQL(),
        createMenuGraphQL(),
        createCategoryGraphQL(),
        createPageGraphQL(),
        createPageElementsGraphQL(),
        createSettingsGraphQL(),
        createBlockCategoryGraphQL(),
        createInstallGraphQL()
    ] as GraphQLSchemaPlugin[];
};
