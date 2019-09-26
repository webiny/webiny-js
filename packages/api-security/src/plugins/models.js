// @flow
import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete } from "@webiny/commodo";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { withUser } from "@webiny/api-security";
import securityGroup from "./models/securityGroup.model";
import securityGroups2Models from "./models/securityGroups2Models.model";
import securityRole from "./models/securityRole.model";
import securityRoles2Models from "./models/securityRoles2Models.model";
import securityUser from "./models/securityUser.model";

export default ({ database }) => ({
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        const driver = new MongoDbDriver({
            database: database.mongodb
        });

        const createBase = () =>
            flow(
                withId(),
                withStorage({ driver }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        const SecurityRole = securityRole({ createBase });
        const SecurityRoles2Models = securityRoles2Models({ createBase, SecurityRole });
        const SecurityGroup = securityGroup({ createBase, SecurityRole, SecurityRoles2Models });
        const SecurityGroups2Models = securityGroups2Models({ createBase, SecurityGroup });
        const SecurityUser = securityUser({
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
            SecurityUser
        };
    }
});
