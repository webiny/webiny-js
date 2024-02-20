import fetch from "node-fetch";
import { format } from "date-fns";
import { FbFormTriggerHandlerPlugin } from "~/types";

const plugin: FbFormTriggerHandlerPlugin = {
    type: "form-trigger-handler",
    name: "form-trigger-handler-webhook",
    trigger: "webhook",
    async handle({ trigger, data, meta, addLog }) {
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
                const response = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify({
                        ...data,
                        meta: {
                            submittedOn: format(new Date(meta.submittedOn), "yyyy-MM-dd HH:mm:ss"),
                            // We don't spread the full `meta` object in order to ensure sensitive data
                            // doesn't end up being included (at the moment, that's IP address).
                            url: meta.url
                        }
                    })
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
};

export default plugin;
