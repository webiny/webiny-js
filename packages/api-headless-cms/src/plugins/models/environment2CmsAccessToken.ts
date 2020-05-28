import { pipe, withFields, ref, withName } from "@webiny/commodo";

export default ({ createBase, context }) =>
    pipe(
        withName("CmsEnvironment2CmsAccessToken"),
        withFields(() => ({
            accessToken: ref({
                instanceOf: context.models.CmsAccessToken
            }),
            environment: ref({
                instanceOf: context.models.CmsEnvironment
            })
        }))
    )(createBase());
