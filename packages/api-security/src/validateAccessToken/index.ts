import { applyGraphQLContextPlugins } from "@webiny/graphql/createSchema/contextPlugins";
import securityModels from "../plugins/models";
import validateAccessToken from "./validateAccessToken";

export default () => [
    {
        type: "before-handler",
        name: "before-handler-validate-access-token",
        async handle({ context }) {
            context.plugins.register(
                // @ts-ignore
                securityModels({})
            );
        }
    },
    {
        type: "handler",
        name: "handler-validate-access-token",
        canHandle() {
            return true;
        },
        async handle({ context, args }) {
            await applyGraphQLContextPlugins(context);
            return await validateAccessToken(context, args[0].PAT);
        }
    }
];
