// @flow
import type { FormRenderComponentPropsType } from "@webiny/app-forms/types";
import { getPlugins } from "@webiny/plugins";
import { get } from "lodash";

type Props = {
    props: FormRenderComponentPropsType,
    data: Object,
    formSubmission: Object
};

export default async (args: Props) => {
    if (args.props.preview) {
        return;
    }

    const { data, props } = args;

    const plugins = getPlugins("form-trigger-handler");
    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i];
        await plugin.trigger.handle({
            trigger: get(props.data, `triggers.${plugin.trigger.id}`) || {},
            data,
            apollo: props.client,
            form: props.data
        });
    }
};
