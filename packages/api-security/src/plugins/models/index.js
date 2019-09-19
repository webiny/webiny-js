// @flow
import { flow } from "lodash";
import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { withUser } from "@webiny/api-security";
import securityGroup from "./SecurityGroup.model";
import securityGroups2Models from "./SecurityGroups2Models.model";
import securityRole from "./SecurityRole.model";
import securityRoles2Models from "./SecurityRoles2Models.model";
import securityUser from "./SecurityUser.model";

export default config => [
    {
        name: "graphql-context-models",
        type: "graphql-context",
        apply(context) {
            const driver = new MongoDbDriver({
                database: config.database.mongodb
            });

            const createBase = () =>
                flow(
                    withId(),
                    withStorage({ driver }),
                    withUser(context)
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
    }
];
