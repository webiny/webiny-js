import { FormRenderProps } from "../../FormRender";
import { CreateFormParamsTrigger, FormSubmissionFieldValues } from "../../types";

interface HandleFormTriggersParams {
    props: FormRenderProps;
    formSubmissionData: FormSubmissionFieldValues;
}

export default async (params: HandleFormTriggersParams) => {
    const { formSubmissionData, props } = params;
    if (props.createFormParams.preview) {
        return;
    }

    let triggers: Array<CreateFormParamsTrigger> = [];
    if (props.createFormParams.triggers) {
        if (typeof props.createFormParams.triggers === "function") {
            triggers = props.createFormParams.triggers();
        } else {
            triggers = props.createFormParams.triggers;
        }
    }

    const { formData } = props;
    for (let i = 0; i < triggers.length; i++) {
        const trigger = triggers[i];
        await trigger.handle({
            trigger: formData?.triggers?.[trigger.id] || {},
            data: formSubmissionData,
            form: formData
        });
    }
};
