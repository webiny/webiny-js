import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import securityGroup from "./models/securityGroup.model";
import securityGroups2Models from "./models/securityGroups2Models.model";
import securityRole from "./models/securityRole.model";
import securityRoles2Models from "./models/securityRoles2Models.model";
import securityUser from "./models/securityUser.model";
import securityPersonalAccessToken from "./models/securityPersonalAccessToken.model";

export default () => ({
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        const driver = context.commodo && context.commodo.driver;

        if (!driver) {
            throw Error(
                `Commodo driver is not configured! Make sure you add a Commodo driver plugin to your service.`
            );
        }

        const createBase = () =>
            flow(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        context.models = {};
        context.models.SecurityRole = securityRole({ createBase });
        context.models.SecurityRoles2Models = securityRoles2Models({ createBase, context });
        context.models.SecurityGroup = securityGroup({
            createBase,
            context
        });
        context.models.SecurityGroups2Models = securityGroups2Models({ createBase, context });
        context.models.SecurityUser = securityUser({
            context,
            createBase
        });
        context.models.SecurityPersonalAccessToken = securityPersonalAccessToken({
            createBase,
            context
        });

        context.models.createBase = createBase;
    }
});
