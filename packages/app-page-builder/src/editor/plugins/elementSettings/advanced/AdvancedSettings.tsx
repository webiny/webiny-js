import React, { useMemo } from "react";
import { cloneDeep } from "lodash";
import { merge } from "dot-prop-immutable";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { plugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { withActiveElement } from "../../../components";
import { Form } from "@webiny/form";
import { PbEditorPageElementAdvancedSettingsPlugin, PbEditorElement } from "../../../../types";

const emptyElement = { data: {}, type: null };

type AdvancedSettingsPropsType = {
    element: PbEditorElement;
};
const AdvancedSettings: React.FunctionComponent<AdvancedSettingsPropsType> = ({ element }) => {
    const { data, type } = element || cloneDeep(emptyElement);

    const eventActionHandler = useEventActionHandler();

    // Get element settings plugins
    const advancedSettingsPlugin = useMemo(() => {
        return plugins
            .byType<PbEditorPageElementAdvancedSettingsPlugin>(
                "pb-editor-page-element-advanced-settings"
            )
            .filter(pl => pl.elementType === element.type || pl.elementType === "all");
    }, [element.type]);

    const onSubmit = (formData: FormData) => {
        formData = advancedSettingsPlugin.reduce((formData, pl) => {
            if (pl.onSave) {
                return pl.onSave(formData);
            }
            return formData;
        }, formData);

        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: merge(element, "data", formData),
                history: true
            })
        );
    };

    if (!advancedSettingsPlugin.length) {
        return null;
    }

    return (
        <Form key={element && element.id} data={data} onSubmit={onSubmit}>
            {({ submit, Bind, data, form }) => (
                <>
                    {renderPlugins(
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
