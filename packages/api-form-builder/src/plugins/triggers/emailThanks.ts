import { ContextPlugin } from "@webiny/api";
import { MailerContext } from "@webiny/api-mailer/types";
import { FbFormTriggerHandlerPlugin } from "~/types";

const plugin = new ContextPlugin<MailerContext>(async context => {
    context.plugins.register({
        type: "form-trigger-handler",
        name: "form-trigger-handler-email-thanks",
        trigger: "email-thanks",
        async handle({ trigger, data, addLog }) {
            const triggerData = trigger && trigger.subject && trigger.content;
            if (!triggerData || !data.email) {
                return;
            }

            // Replace "{fields.valueName}" with values from form
            const contentWithVariables = (trigger.content as string).replace(
                /{fields\.(.*?)}/g,
                (_, valueName) => data[valueName] || ""
            );

            try {
                const response = await context.mailer.sendMail({
                    to: [data.email],
                    subject: trigger.subject,
                    html: `<pre style="font-family: 'Open Sans', sans-serif;">${contentWithVariables}</pre>`
                });

                addLog({
                    type: "success",
                    message: `Successfully sent a thank you e-mail to ${data.email}.`,
                    data: {
                        response: response.result
                    }
                });
            } catch (e) {
                addLog({
                    type: "warning",
                    message: `Failed to send a thank you e-mail to ${data.email}: ${e.message}`
                });
            }
        }
    } as FbFormTriggerHandlerPlugin);
});

export default plugin;
