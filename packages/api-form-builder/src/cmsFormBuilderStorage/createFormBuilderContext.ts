import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";
import { FormBuilderContextSetup } from "./FormBuilderContextSetup";
import { createGraphQLSchemaPlugin } from "./createGraphQLSchemaPlugin";

export const createFormBuilderContext = ({ storageOperations }: { storageOperations: any }) => {
    const plugin = new ContextPlugin<FormBuilderContext>(async context => {
        const fbContext = new FormBuilderContextSetup(context);
        await fbContext.setupContext(storageOperations);
    });

    plugin.name = "form-builder.createContext";

    return plugin;
};

export const createFormBuilderGraphQL = () => {
    return createGraphQLSchemaPlugin();
};
