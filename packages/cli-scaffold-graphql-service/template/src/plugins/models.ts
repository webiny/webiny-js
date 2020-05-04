import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import models from "./models/";

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
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        const MyModel = models.myModel({ createBase });
        const Models = Object.entries(models).reduce(
            (acc, [modelName, val]) => ({ ...acc, [modelName]: val({ createBase }) }),
            {}
        );

        context.models = {
            MyModel,
            createBase
        };
    }
});
