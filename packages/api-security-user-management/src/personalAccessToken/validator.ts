import securityModels from "../models";

export default () => [
    securityModels(),
    {
        type: "handler",
        name: "handler-validate-access-token",
        async handle(context) {
            const event = context.invocationArgs;
            let pat = event.pat;

            if (!pat || typeof pat !== "string") {
                return null;
            }

            pat = pat.toLowerCase();
            const token = await context.models.SecurityPersonalAccessToken.findOne({
                query: { token: pat }
            });

            if (!token) {
                return null;
            }

            const user = await token.user;
            if (!user) {
                return null;
            }

            return {
                id: user.id,
                type: "user",
                email: user.email,
                displayName: user.fullName
            };
        }
    }
];
