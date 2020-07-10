import { withStorage, withFields, string, withName, pipe } from "@webiny/commodo";
import { SecurityIdentity } from "@webiny/api-security/utils";

const getAuthorizationToken = context => {
    const { headers } = context.event;
    return headers.authorization || headers.Authorization;
};

const createBase = context =>
    pipe(
        withFields({
            id: context.commodo.fields.id()
        }),
        withStorage({ driver: context.commodo.driver })
    )();

const createModels = context => ({
    CmsAccessToken: pipe(withName("CmsAccessToken"))(createBase(context)),
    CmsEnvironment2AccessToken: pipe(
        withName("CmsEnvironment2AccessToken"),
        withFields(() => ({
            environment: string()
        }))
    )(createBase(context))
});

export default {
    name: "authentication-access-token",
    type: "authentication",
    authenticate: async context => {
        if (!context.event) {
            return;
        }

        if (context.event.isMetaQuery) {
            // Allow "getMeta" query.
            return new SecurityIdentity();
        }

        const { CmsAccessToken, CmsEnvironment2AccessToken } = createModels(context);

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

        context.security.user = token;

        return true;
    }
};
