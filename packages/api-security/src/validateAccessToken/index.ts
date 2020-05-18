import { applyContextPlugins } from "@webiny/graphql/createSchema/contextPlugins";
import securityModels from "../plugins/models";
import validateAccessToken from "./validateAccessToken";

export default () => [
    {
        type: "context",
        name: "handler-validate-access-token",
        async apply(context) {
            const superSecure = args.superSecure;

            context.plugins.register(securityModels(superSecure));
        }
    },
    {
        type: "handler",
        name: "handler-validate-access-token",
        async handle({ context, args }) {
            const superSecure = args.superSecure;

            context.plugins.register();

            return await validateAccessToken(context, args[0].PAT);
        }
    }
];
