import { withStorage, withFields, string, withName, pipe } from "@webiny/commodo";

const createAccessToken = createBase => pipe(withName("CmsAccessToken"))(createBase());

const environment2accessToken = createBase =>
    pipe(
        withName("CmsEnvironment2AccessToken"),
        withFields(() => ({
            environment: string()
        }))
    )(createBase());

const getAuthorizationToken = context => {
    const { headers } = context.event;
    return headers.authorization || headers.Authorization;
};

export default {
    name: "authentication-access-token",
    type: "authentication",
    authenticate: async context => {
        if (!context.event) {
            return;
        }

        if (context.event.isMetaQuery) {
            return;
        }

        const createBase = () =>
            pipe(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver: context.commodo.driver })
            )();

        const CmsAccessToken = createAccessToken(createBase);
        const CmsEnvironment2AccessToken = environment2accessToken(createBase);

        const accessToken = getAuthorizationToken(context);
        if (!accessToken) {
            return false;
        }

        const token = await CmsAccessToken.findOne({
            query: { token: accessToken }
        });

        if (!token) {
            return false;
        }

        const allowedEnvironments = await CmsEnvironment2AccessToken.find({
            query: { accessToken: token.id }
        });
        const currentEnvironment = context.cms.getEnvironment();
        if (!allowedEnvironments.find(env => env.id === currentEnvironment.id)) {
            return false;
        }

        context.token = token;

        return true;
    }
};
