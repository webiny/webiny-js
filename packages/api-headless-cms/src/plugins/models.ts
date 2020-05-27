import { pipe, withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import cmsEnvironment from "./models/environment.model";
import cmsEnvironmentAlias from "./models/environmentAlias.model";
import cmsSettings from "./models/cmsSettings.model";
import cmsContentModelGroup from "./models/contentModelGroup.model";
import cmsAccessToken from "./models/accessToken.model";

export default () => ({
    name: "context-models",
    type: "context",
    apply(context) {
        const driver = context.commodo && context.commodo.driver;

        if (!driver) {
            throw Error(
                `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
            );
        }

        const createBase = () =>
            pipe(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        context.models = { createBase };
        context.models.CmsEnvironment = cmsEnvironment({ createBase, context });
        context.models.CmsEnvironmentAlias = cmsEnvironmentAlias({ createBase, context });
        context.models.CmsSettings = cmsSettings({ createBase });
        context.models.CmsContentModelGroup = cmsContentModelGroup({ createBase, context });
        context.models.CmsAccessToken = cmsAccessToken({ createBase, context });
    }
});
