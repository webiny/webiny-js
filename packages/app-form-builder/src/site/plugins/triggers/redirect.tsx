// @flow
import type { FormTriggerHandlerPluginType } from "@webiny/app-form-builder/types";

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
