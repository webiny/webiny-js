import { FbFormTriggerHandlerPlugin } from "~/types";

const plugin: FbFormTriggerHandlerPlugin = {
    type: "form-trigger-handler",
    name: "form-trigger-handler-redirect",
    trigger: {
        id: "redirect",
        handle({ trigger }) {
            if (trigger.url) {
                window.location = trigger.url;
            }
        }
    }
};
export default plugin;
