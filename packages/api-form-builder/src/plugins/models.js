// @flow
import { flow } from "lodash";
import { withUser } from "@webiny/api-security";
import { withStorage, withCrudLogs, withSoftDelete, withFields } from "@webiny/commodo";

import formModel from "./models/form.model";
import formSettings from "./models/formSettings.model";
import formSubmission from "./models/formSubmission.model";

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

        const createBase = ({ maxPerPage = 100 } = {}) =>
            flow(
                withFields({
                    id: context.commodo.fields.id()
                }),
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
