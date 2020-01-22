import {
    FbFormRenderComponentProps,
    FbFormTriggerHandlerPlugin,
    FormSubmitResponseType
} from "@webiny/app-form-builder/types";
import { getPlugins } from "@webiny/plugins";
import { get } from "lodash";

type HandleFormTriggersArgs = {
    props: FbFormRenderComponentProps;
    data: any;
    formSubmission: FormSubmitResponseType;
};

export default async (args: HandleFormTriggersArgs) => {
    if (args.props.preview) {
        return;
    }

    const { data, props } = args;

    const plugins = getPlugins<FbFormTriggerHandlerPlugin>("form-trigger-handler");
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        await plugin.trigger.handle({
            trigger: get(props.data, `triggers.${plugin.trigger.id}`) || {},
            data,
            form: props.data
        });
    }
};
