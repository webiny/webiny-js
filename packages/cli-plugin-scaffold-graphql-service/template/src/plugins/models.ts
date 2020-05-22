import { flow } from "lodash";
// @ts-ignore
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";
import { withUser } from "@webiny/api-security";
import book from "./models/book.model";

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

        context.models = {
            Book: book({ createBase }),
            createBase
        };
    }
});
