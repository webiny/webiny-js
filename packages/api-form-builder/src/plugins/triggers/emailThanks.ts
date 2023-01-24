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

            try {
                const response = await context.mailer.sendMail({
                    to: [data.email],
                    subject: trigger.subject,
                    text: "",
                    html: `<pre style="font-family: 'Open Sans', sans-serif;">${trigger.content}</pre>`
                });

                addLog({
                    type: "success",
                    message: `Successfully sent a thanks e-mail to ${data.email}`,
                    data: {
                        response: response.result
                    }
                });
            } catch (e) {
                addLog({
                    type: "warning",
                    message: `Failed to send a thanks e-mail to ${data.email}: ${e.message}`
                });
            }
        }
    } as FbFormTriggerHandlerPlugin);
});

export default plugin;
