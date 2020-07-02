// @ts-ignore
import { withStorage, withCrudLogs, withSoftDelete, withFields, pipe } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import entity from "./models/entity.model";

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

        context.models = {
            Entity: entity({ createBase }),
            createBase
        };
    }
});
