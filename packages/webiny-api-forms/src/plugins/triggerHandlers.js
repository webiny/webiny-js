// @flow
import type { FormTriggerHandlerPluginType } from "webiny-api-forms/types";
import got from "got";

export default ({
    type: "form-trigger-handler",
    name: "form-trigger-handler-webhook",
    trigger: "webhook",
    async handle({ trigger, data, formSubmission }) {
        const urls = trigger && trigger.urls;
        if (Array.isArray(urls)) {
            for (let i = 0; i < urls.length; i++) {
                let url = urls[i];
                // Could be executed without awaiting the end result of the trigger? Not sure how it would
                // work in Lambda, so for now, let's await the result of the request, and update form submission
                // logs accordingly.
                try {
                    const response = await got(url, {
                        method: "post",
                        json: true,
                        body: data
                    });

                    formSubmission.addLog({
                        type: "success",
                        message: `Successfully sent a POST request to ${url}`,
                        data: {
                            response: response.body
                        }
                    });
                } catch (e) {
                    formSubmission.addLog({
                        type: "warning",
                        message: `POST request to ${url} failed: ${e.message}`
                    });
                }
            }
        }
    }
}: FormTriggerHandlerPluginType);
