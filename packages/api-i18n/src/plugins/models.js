// @flow
import { flow } from "lodash";
import { withStorage, withCrudLogs, withSoftDelete } from "@webiny/commodo";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { withUser } from "@webiny/api-security";
import i18NLocale from "./models/i18nLocale.model";

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

        const I18NLocale = i18NLocale({ createBase });

        context.models = {
            I18NLocale
        };
    }
});
