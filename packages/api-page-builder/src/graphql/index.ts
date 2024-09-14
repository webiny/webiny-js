import { createCrud, CreateCrudParams } from "./crud";
import graphql from "./graphql";
import { createTranslations, createTranslationsGraphQl } from "~/translations/createTranslations";
import { PluginCollection } from "@webiny/plugins/types";

export const createPageBuilderGraphQL = (): PluginCollection => {
    return [...graphql(), ...createTranslationsGraphQl()];
};

export type ContextParams = CreateCrudParams;
export const createPageBuilderContext = (params: ContextParams) => {
    return [createCrud(params), ...createTranslations()];
};

export * from "./crud/pages/PageContent";
export * from "./crud/pages/PageElementId";
