/**
 * Since form-field-validator plugin needs access to the request context, we create a context plugin which
 * registers the actual validation plugin with access to the request context.
 */
import { ContextPlugin } from "@webiny/graphql/types";
import { getFormSubmission } from '@webiny/api-form-builder/plugins/graphql/formSubmissionResolvers/getFormSubmission';

export default {
    name: "context-form-field-unique-validator",
    type: "context",
    apply(context) {
        context.plugins.register({
            type: "form-field-validator",
            name: "form-field-validator-unique",
            validator: {
                name: "unique",
                serverSideOnly: true,
                validate: async (form, field, value) => {
                    const fieldId = field.fieldId;
                    const submissions = await getFormSubmission(context, form.parent, fieldId, value);
                    return submissions.length === 0;
                }
            }
        });
    }
} as ContextPlugin;
