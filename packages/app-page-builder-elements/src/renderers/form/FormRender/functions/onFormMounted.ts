import { FormRenderProps } from "~/renderers/form/FormRender";

export default async (props: FormRenderProps): Promise<void> => {
    const { formData, createFormParams } = props;
    if (createFormParams.preview) {
        return;
    }

    // SSR?
    if (!window) {
        return;
    }

    const key = `form_view_${formData!.id}`;

    if (window.localStorage[key]) {
        return;
    }

    window.localStorage[key] = "1";

    await createFormParams.dataLoaders.logFormView({ variables: { revision: formData!.id } });
};
