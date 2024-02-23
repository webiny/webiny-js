import createCruds from "./plugins/crud";
import graphql from "./plugins/graphql";
import triggerHandlers from "./plugins/triggers";
import settings from "./plugins/settings";
import validators from "./plugins/validators";
import formsGraphQL from "./plugins/graphql/form";
import formSettingsGraphQL from "./plugins/graphql/formSettings";
import formBuilderPrerenderingPlugins from "~/plugins/prerenderingHooks";
import { FormBuilderStorageOperations } from "~/types";

export interface CreateFormBuilderParams {
    storageOperations: FormBuilderStorageOperations;
}

export const createFormBuilder = (params: CreateFormBuilderParams) => {
    return [
        createCruds(params),
        graphql,
        triggerHandlers,
        validators,
        formsGraphQL,
        formSettingsGraphQL,
        formBuilderPrerenderingPlugins(),
        settings
    ];
};
