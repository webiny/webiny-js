import React from "react";
import { merge } from "dot-prop-immutable";
import { renderPlugins } from "@webiny/app/plugins";
import { plugins } from "@webiny/plugins";
import { Form, FormRenderPropParams } from "@webiny/form";
import { PbEditorPageElementAdvancedSettingsPlugin } from "~/types";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { FormData } from "@webiny/form/types";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { makeComposable } from "@webiny/app-admin";

export const ElementSettings: React.FC = () => {
    const [element] = useActiveElement();
    const updateElement = useUpdateElement();

    const onSubmit = async (formData: FormData) => {
        const settingsPlugins = plugins
            .byType<PbEditorPageElementAdvancedSettingsPlugin>(
                "pb-editor-page-element-advanced-settings"
            )
            .filter(pl => pl.elementType === element?.type);

        let modifiedFormData = formData;
        for (const plugin of settingsPlugins) {
            if (typeof plugin?.onSave === "function") {
                modifiedFormData = await plugin.onSave(modifiedFormData);
            }
        }

        updateElement(merge(element, "data", modifiedFormData));
    };

    if (!element) {
        return null;
    }

    return (
        <Form key={element && element.id} data={element.data} onSubmit={onSubmit}>
            {formProps => (
                <>
                    <ElementSettingsRenderer formProps={formProps} />
                </>
            )}
        </Form>
    );
};

export const ElementSettingsRenderer = makeComposable(
    "ElementSettingsRenderer",
    // Settings this to `any`, because this API is now deprecated, and we don't want to have it visible.
    ({ formProps }: any) => {
        return <LegacyPlugins formProps={formProps} />;
    }
);

interface LegacyPluginsProps {
    formProps: FormRenderPropParams;
}

const LegacyPlugins: React.FC<LegacyPluginsProps> = ({ formProps }) => {
    const [element] = useActiveElement();

    if (!element) {
        return null;
    }

    return (
        <>
            {renderPlugins<PbEditorPageElementAdvancedSettingsPlugin>(
                "pb-editor-page-element-advanced-settings",
                formProps,
                {
                    wrapper: false,
                    filter: pl => pl.elementType === element.type || pl.elementType === "all"
                }
            )}
        </>
    );
};
