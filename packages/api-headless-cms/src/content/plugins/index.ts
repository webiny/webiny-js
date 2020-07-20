import { ContextPlugin } from "@webiny/graphql/types";
import models from "./models";
import modelFields from "./modelFields";
import filterOperators from "./filterOperators";
import graphqlFields from "./graphqlFields";
import graphql from "./graphql";
import { TypeValueEmitter } from "./utils/TypeValueEmitter";
import addRefFieldHooks from "./modelFields/refField/addRefFieldHooks";
import authenticationPlugin from "./authentication";
import checkRefFieldsBeforeSave from "./modelFields/refField/checkRefFieldsBeforeSave";

type HeadlessPluginsOptions = {
    dataManagerFunction?: string;
    type?: string;
    environment?: string;
};

export default (
    options: HeadlessPluginsOptions = {
        dataManagerFunction: null,
        type: null,
        environment: null
    }
) => [
    {
        name: "context-cms-context",
        type: "context",
        preApply(context) {
            // These default values are here only because of the existing tests. In some of those, GraphQL queries
            // are directly executed against schema, and not via a regular Apollo Handler invocation. In those cases,
            // the "context.args" is missing, so that's why we added additional levels of checks to be 100% certain.
            const args = context.args || [];
            let [event] = args;
            if (!event) {
                event = {};
            }

            // We register plugins according to the received path params (schema type and environment).
            const { key = "" } = event.pathParameters || {};
            let [type, environment] = key.split("/");

            if (!type) {
                type = options.type || event.type;
            }

            if (!environment) {
                environment = options.environment || event.environment;
            }

            context.cms = context.cms || {};
            context.cms.type = type || "read";
            context.cms.environment = environment;
            context.cms.dataManagerFunction = options.dataManagerFunction;

            context.cms.READ = type === "read";
            context.cms.PREVIEW = type === "preview";
            context.cms.MANAGE = type === "manage";

            if (!context.cms.MANAGE) {
                context.resolvedValues = new TypeValueEmitter();
            }
        }
    } as ContextPlugin,
    graphql(),
    checkRefFieldsBeforeSave(),
    addRefFieldHooks(),
    models(),
    modelFields,
    graphqlFields,
    authenticationPlugin,
    filterOperators()
];
