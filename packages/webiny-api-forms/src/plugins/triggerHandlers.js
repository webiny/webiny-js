// @flow
import type { FormTriggerHandlerPluginType } from "webiny-api-forms/types";
import got from "got";

const Mailchimp = function({ apiKey }) {
    this.apiKey = apiKey;

    this.isValidApiKey = async () => {
        try {
            await this.get({
                path: `/lists/`
            });
            return true;
        } catch (e) {
            return false;
        }
    };

    this.get = ({ path }) => {
        return this.request({ path, method: "get" });
    };

    this.post = ({ path, body }) => {
        return this.request({ path, body, method: "post" });
    };

    this.request = ({ path, method, body }: Object) => {
        // eslint-disable-next-line
        const [hash, dataCenter] = this.apiKey.split("-");
        return got(`https://${dataCenter}.api.mailchimp.com/3.0` + path, {
            method,
            json: true,
            body,
            headers: {
                authorization: "apikey " + this.apiKey
            }
        });
    };
};

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
                    const reza = await got(url, {
                        method: "post",
                        json: true,
                        body: data
                    });
                    formSubmission.addLog({
                        type: "success",
                        message: `Successfully sent a POST request to ${url}`,
                        data: {
                            response: reza.body
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
