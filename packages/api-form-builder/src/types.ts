import { PluginType } from "@webiny/api/types";

export type FormTriggerHandlerParams = {
    formSubmission: {[key: string]: any};
    trigger: {[key: string]: any};
    data: {[key: string]: any};
    form: {[key: string]: any};
};

export type FormTriggerHandlerPluginType = PluginType & {
    trigger: string;
    handle: (args: FormTriggerHandlerParams) => Promise<void>;
};
