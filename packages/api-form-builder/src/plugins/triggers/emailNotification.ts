import { ContextPlugin } from "@webiny/api";
import { MailerContext } from "@webiny/api-mailer/types";
import { FbFormTriggerHandlerPlugin } from "~/types";

const plugin = new ContextPlugin<MailerContext>(async context => {
    context.plugins.register({
        type: "form-trigger-handler",
        name: "form-trigger-handler-email-notification",
        trigger: "email-notification",
        async handle({ trigger, data, form, addLog }) {
            const email = trigger && trigger.email;
            if (!email) {
                return;
            }

            let fieldsString = "";
            for (const field in data) {
                const formFieldName =
                    form.fields.find(formField => formField.fieldId === field)?.label || field;
                fieldsString += `${formFieldName}: ${data[field]}\n`;
            }

            try {
                const response = await context.mailer.sendMail({
                    to: [trigger.email],
                    subject: `${form.name} - New Form Submission`,
                    text:
                        "Hi," +
                        `\n\nsomeone just submitted a form: ${form.name}` +
                        `\n\n${fieldsString}` +
                        "\nBest," +
                        "\n\nWebiny"
                });

                addLog({
                    type: "success",
                    message: `Successfully sent a notification e-mail to ${trigger.email}.`,
                    data: {
                        response: response.result
                    }
                });
            } catch (e) {
                addLog({
                    type: "warning",
                    message: `Failed to send a notification e-mail to ${trigger.email}: ${e.message}`
                });
            }
        }
    } as FbFormTriggerHandlerPlugin);
});

export default plugin;
