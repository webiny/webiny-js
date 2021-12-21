import { createPageSettingsGeneralGraphQL } from "./general";
import { createPageSettingsSeoGraphQL } from "./seo";
import { createPageSettingsSocialGraphQL } from "./social";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export const createPageSettingsGraphQL = (): GraphQLSchemaPlugin[] => {
    return [
        createPageSettingsGeneralGraphQL(),
        createPageSettingsSeoGraphQL(),
        createPageSettingsSocialGraphQL()
    ];
};
