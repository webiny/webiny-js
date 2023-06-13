import { FbFormTriggerHandlerPlugin } from "~/types";

const plugin: FbFormTriggerHandlerPlugin = {
    type: "form-trigger-handler",
    name: "form-trigger-handler-google-analytics-event",
    trigger: {
        id: "google-analytics-event",
        handle({ trigger }) {
            if (!trigger?.eventName) {
                return;
            }

            if (typeof gtag === "function") {
                const eventParams = (
                    (trigger.eventParams as Array<{
                        name: string;
                        content: string;
                    }>) || []
                ).reduce((obj, item) => Object.assign(obj, { [item.name]: item.content }), {});
                gtag("event", trigger.eventName, eventParams);
            }
        }
    }
};

export default plugin;
