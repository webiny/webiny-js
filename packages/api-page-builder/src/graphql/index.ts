import { createCrud, CreateCrudParams } from "./crud";
import graphql from "./graphql";
import { createTranslations } from "~/translations/createTranslations";
import { PluginCollection } from "@webiny/plugins/types";

export const createPageBuilderGraphQL = (): PluginCollection => {
    return [...graphql(), ...createTranslations()];
};

export type ContextParams = CreateCrudParams;
export const createPageBuilderContext = (params: ContextParams) => {
    return [createCrud(params)];
};

export * from "./crud/pages/PageContent";
export * from "./crud/pages/PageElementId";
