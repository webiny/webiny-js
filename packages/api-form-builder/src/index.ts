import createCruds from "./plugins/crud";
import graphql from "./plugins/graphql";
import upgrades from "./plugins/upgrades";
import triggerHandlers from "./plugins/triggers/triggerHandlers";
import validators from "./plugins/validators";
import formsGraphQL from "./plugins/graphql/form";
import formSettingsGraphQL from "./plugins/graphql/formSettings";
import { FormBuilderStorageOperations } from "~/types";

export interface Params {
    storageOperations: FormBuilderStorageOperations;
}

export const createFormBuilder = (params: Params) => {
    return [
        createCruds(params),
        graphql,
        upgrades,
        triggerHandlers,
        validators,
        formsGraphQL,
        formSettingsGraphQL
    ];
};
