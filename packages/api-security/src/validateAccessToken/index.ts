import { applyContextPlugins } from "@webiny/graphql/createSchema/contextPlugins";
import securityModels from "../plugins/models";
import validateAccessToken from "./validateAccessToken";

export default () => [
    {
        type: "handler",
        name: "handler-validate-access-token",
        async handle({ context, args }) {
            context.plugins.register(securityModels());

            await applyContextPlugins(context);
            return await validateAccessToken(context, args[0].PAT);
        }
    }
];
