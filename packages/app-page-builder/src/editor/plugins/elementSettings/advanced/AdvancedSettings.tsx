import React, { useMemo } from "react";
import { cloneDeep } from "lodash";
import { merge } from "dot-prop-immutable";
import { plugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { withActiveElement } from "../../../components";
import { Form } from "@webiny/form";
import { PbEditorPageElementAdvancedSettingsPlugin, PbEditorElement } from "~/types";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { FormData } from "@webiny/form/types";

const emptyElement: Partial<PbEditorElement> = { data: {}, type: "" };

interface AdvancedSettingsPropsType {
    element: PbEditorElement;
}
const AdvancedSettings: React.FC<AdvancedSettingsPropsType> = ({ element }) => {
    const { data, type } = element || cloneDeep(emptyElement);

    const updateElement = useUpdateElement();

    // Get element settings plugins
    const advancedSettingsPlugin = useMemo(() => {
        return plugins
            .byType<PbEditorPageElementAdvancedSettingsPlugin>(
                "pb-editor-page-element-advanced-settings"
            )
            .filter(pl => pl.elementType === type || pl.elementType === "all");
    }, [type]);

    const onSubmit = (formData: FormData) => {
        const newFormData = advancedSettingsPlugin.reduce((formData, pl) => {
            if (pl.onSave) {
                return pl.onSave(formData);
            }
            return formData;
        }, formData);

        updateElement(merge(element, "data", newFormData));
    };

    if (!advancedSettingsPlugin.length) {
        return null;
    }

    return (
        <Form key={element && element.id} data={data} onSubmit={onSubmit}>
            {({ submit, Bind, data, form }) => (
                <>
                    {renderPlugins<PbEditorPageElementAdvancedSettingsPlugin>(
                        "pb-editor-page-element-advanced-settings",
                        { Bind, data, form, submit },
                        {
                            wrapper: false,
                            filter: pl => pl.elementType === type || pl.elementType === "all"
                        }
                    )}
                </>
            )}
        </Form>
    );
};

const AdvancedSettingsMemoized = React.memo(AdvancedSettings);

export default withActiveElement()(AdvancedSettingsMemoized);
