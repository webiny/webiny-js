import securityModels from "../plugins/models";
import validateAccessToken from "./validateAccessToken";

export default () => [
    securityModels(),
    {
        type: "handler",
        name: "handler-validate-access-token",
        async handle({ context }) {
            const [event] = context.args;

            return await validateAccessToken(context, event.pat);
        }
    }
];
