// @flow
import type { FormTriggerHandlerPluginType } from "@webiny/app-forms/types";

export default ({
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
}: FormTriggerHandlerPluginType);
