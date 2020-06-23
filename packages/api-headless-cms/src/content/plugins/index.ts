import { ContextPlugin } from "@webiny/graphql/types";
import models from "./models";
import modelFields from "./modelFields";
import filterOperators from "./filterOperators";
import graphqlFields from "./graphqlFields";
import graphql from "./graphql";
import { TypeValueEmitter } from "./utils/TypeValueEmitter";
import addRefFieldHooks from "./modelFields/refField/addRefFieldHooks";

type HeadlessPluginsOptions = {
    type: string;
    environment: string;
    dataManagerFunction?: string;
};

export default (
    options: HeadlessPluginsOptions = {
        type: null,
        environment: null,
        dataManagerFunction: null
    }
) => [
    {
        name: "context-cms-context",
        type: "context",
        apply(context) {
            context.cms = context.cms || {};
            context.cms.type = options.type || "read";
            context.cms.environment = options.environment;
            context.cms.dataManagerFunction = options.dataManagerFunction;

            context.cms.READ = options.type === "read";
            context.cms.PREVIEW = options.type === "preview";
            context.cms.MANAGE = options.type === "manage";

            if (!context.cms.MANAGE) {
                context.resolvedValues = new TypeValueEmitter();
            }
        }
    } as ContextPlugin,
    addRefFieldHooks(),
    models(),
    {
        name: "context-cms-validate-access-token",
        type: "context",
        async apply(context) {
            if (!context.event) {
                return;
            }

            if (context.event.isMetaQuery) {
                return;
            }

            if (process.env.NODE_ENV === "test") {
                // Skip authentication when running tests
                return;
            }

            if (
                context.user &&
                context.user.id &&
                context.user.access &&
                context.user.access.fullAccess
            ) {
                // A valid JWT was provided and context.user was populated with our user's data, including their user ID.
                // If they have fullAccess, then they're admins which are allowed to access the API...
                return;
            }

            if (context.cms.READ || context.cms.PREVIEW) {
                const accessToken =
                    context.event.headers["authorization"] ||
                    context.event.headers["Authorization"];
                const { CmsAccessToken } = context.models;

                const token = await CmsAccessToken.findOne({
                    query: { token: accessToken }
                });

                if (!token) {
                    throw new Error("Not authorized!");
                }

                const allowedEnvironments = await token.environments;
                const currentEnvironment = context.cms.getEnvironment();
                if (!allowedEnvironments.find(env => env.id === currentEnvironment.id)) {
                    throw new Error(
                        `You are not authorized to access "${currentEnvironment.name}" environment!`
                    );
                }
            } else if (context.cms.MANAGE) {
                throw new Error(
                    "Not authorized! Make sure you provided a valid JWT in the 'authorization' header."
                );
            }
        }
    },
    graphql(options),
    modelFields,
    graphqlFields,
    filterOperators()
];
