import {
    FbFormRenderComponentProps,
    FbFormTriggerHandlerPlugin,
    FormSubmitResponseType
} from "~/types";
import { plugins } from "@webiny/plugins";
import get from "lodash/get";

interface HandleFormTriggersArgs {
    props: FbFormRenderComponentProps;
    data: any;
    formSubmission: FormSubmitResponseType;
}

export default async (args: HandleFormTriggersArgs) => {
    if (args.props.preview) {
        return;
    }

    const { data, props } = args;

    const formTriggerHandlerPlugins =
        plugins.byType<FbFormTriggerHandlerPlugin>("form-trigger-handler");
    for (let i = 0; i < formTriggerHandlerPlugins.length; i++) {
        const plugin = formTriggerHandlerPlugins[i];
        await plugin.trigger.handle({
            trigger: get(props.data, `triggers.${plugin.trigger.id}`) || {},
            data,
            form: props.data || {}
        });
    }
};
