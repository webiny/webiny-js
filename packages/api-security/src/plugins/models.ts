import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import securityGroup from "./models/securityGroup.model";
import securityGroups2Models from "./models/securityGroups2Models.model";
import securityRole from "./models/securityRole.model";
import securityRoles2Models from "./models/securityRoles2Models.model";
import securityUser from "./models/securityUser.model";

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

        const SecurityRole = securityRole({ createBase });
        const SecurityRoles2Models = securityRoles2Models({ createBase, SecurityRole });
        const SecurityGroup = securityGroup({
            createBase,
            SecurityRole,
            SecurityRoles2Models
        });
        const SecurityGroups2Models = securityGroups2Models({ createBase, SecurityGroup });
        const SecurityUser = securityUser({
            context,
            createBase,
            SecurityRole,
            SecurityRoles2Models,
            SecurityGroups2Models,
            SecurityGroup
        });

        context.models = {
            SecurityRole,
            SecurityRoles2Models,
            SecurityGroup,
            SecurityGroups2Models,
            SecurityUser,
            createBase
        };
    }
});
