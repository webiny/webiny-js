import got from "got";
import { FbFormTriggerHandlerPlugin } from "~/types";

const plugin: FbFormTriggerHandlerPlugin = {
    type: "form-trigger-handler",
    name: "form-trigger-handler-webhook",
    trigger: "webhook",
    async handle({ trigger, data, addLog }) {
        const urls = trigger && trigger.urls;
        if (Array.isArray(urls)) {
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
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
    }
};

export default plugin;
