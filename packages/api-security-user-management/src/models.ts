import SecurityModel from "./models/security.model";
import { SecurityPersonalAccessTokenData } from "./models/securityPersonalAccessTokenData.model";
import { SecurityUserData } from "./models/securityUserData.model";
import { SecurityGroupData } from "./models/securityGroupData.model";

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

        context.models = context.models || {};

        context.models.SecurityPersonalAccessToken = SecurityPersonalAccessTokenData({ context });
        context.models.SecurityUser = SecurityUserData({ context });
        context.models.SecurityGroup = SecurityGroupData();
        context.models.Security = SecurityModel({ context });
    }
});
