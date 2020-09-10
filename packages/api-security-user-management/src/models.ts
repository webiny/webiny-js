import { flow } from "lodash";
import {
    withStorage,
    withCrudLogs,
    withSoftDelete,
    withFields,
    withProps,
    withStaticProps,
    string
} from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import securityGroup from "./models/securityGroup.model";
import securityGroups2Models from "./models/securityGroups2Models.model";
import securityUser from "./models/securityUser.model";
import securityPersonalAccessToken from "./models/securityPersonalAccessToken.model";

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
            flow(
                withFields({
                    id: string()
                }),
                withStorage({ driver }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs(),
                withProps({
                    isId() {
                        return true;
                    }
                }),
                withStaticProps({
                    isId() {
                        return true;
                    }
                })
            )();

        context.models = context.models || {};
        context.models.SecurityGroup = securityGroup({
            createBase
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
