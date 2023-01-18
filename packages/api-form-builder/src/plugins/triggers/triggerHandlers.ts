import got from "got";
import { SmtpTransportConfig, createSmtpTransport } from "@webiny/api-mailer";
import { FbFormTriggerHandlerPlugin } from "~/types";

const plugins: FbFormTriggerHandlerPlugin[] = [
    {
        type: "form-trigger-handler",
        name: "form-trigger-handler-webhook",
        trigger: "webhook",
        async handle({ trigger, data, addLog }) {
            const urls = trigger && trigger.urls;
            if (!urls || Array.isArray(urls) === false) {
                return;
            }
            for (const url of urls) {
                /**
                 * Could be executed without awaiting the end result of the trigger? Not sure how it would
                 * work in Lambda, so for now, let's await the result of the request, and update form submission
                 * logs accordingly.
                 */
                try {
                    const response = await got(url, {
                        method: "post",
                        json: true,
                        body: data
                    });

                    addLog({
                        type: "success",
                        message: `Successfully sent a POST request to ${url}`,
                        data: {
                            response: response.body
                        }
                    });
                } catch (e) {
                    addLog({
                        type: "warning",
                        message: `POST request to ${url} failed: ${e.message}`
                    });
                }
            }
        }
    },
    {
        type: "form-trigger-handler",
        name: "form-trigger-handler-email",
        trigger: "email",
        async handle({ trigger, data, form, addLog }) {
            const email = trigger && trigger.email;
            if (!email) {
                return;
            }

            const config: SmtpTransportConfig = {
                host: process.env.WEBINY_MAILER_HOST,
                auth: {
                    user: process.env.WEBINY_MAILER_USER,
                    pass: process.env.WEBINY_MAILER_PASSWORD
                }
            };

            const mailer = createSmtpTransport(config);

            let fieldsString = "";
            for (const field in data) {
                const formFieldName =
                    form.fields.find(formField => formField.fieldId === field)?.label || field;
                fieldsString += `${formFieldName}: ${data[field]}\n`;
            }

            try {
                const response = await mailer.send({
                    bcc: [trigger.email],
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
                    message: `Successfully sent an email to ${trigger.email}`,
                    data: {
                        response: response.result
                    }
                });
            } catch (e) {
                addLog({
                    type: "warning",
                    message: `Failed to send an email to ${trigger.email}: ${e.message}`
                });
            }
        }
    }
];

export default plugins;
