// @flow
import type { PluginType } from "@webiny/plugins/types";

export type FormTriggerHandlerPluginType = PluginType & {
    trigger: string,
    handle: ({
        formSubmission: Object,
        trigger: Object,
        data: Object,
        form: Object
    }) => Promise<void>
};
