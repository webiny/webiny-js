// @flow
import { flow } from "lodash";
import { withUser } from "@webiny/api-security";
import { withStorage, withCrudLogs, withSoftDelete } from "@webiny/commodo";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";

import formModel from "./models/form.model";
import formSettings from "./models/formSettings.model";
import formSubmission from "./models/formSubmission.model";

export default ({ database }) => ({
    name: "graphql-context-models",
    type: "graphql-context",
    apply(context) {
        const driver = new MongoDbDriver({
            database: database.mongodb
        });

        const createBase = ({ maxPerPage = 100 } = {}) =>
            flow(
                withId(),
                withStorage({ driver, maxPerPage }),
                withUser(context),
                withSoftDelete(),
                withCrudLogs()
            )();

        const FormSettings = formSettings({ createBase });
        const Form = formModel({ createBase, context, FormSettings });
        const FormSubmission = formSubmission({ createBase, context, Form });

        context.models = {
            Form,
            FormSettings,
            FormSubmission
        };
    }
});
