import React, { useCallback, useEffect, useMemo } from "react";
import { useRecoilValue } from "recoil";
import { cloneDeep } from "lodash";
import { merge } from "dot-prop-immutable";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import {
    DeactivatePluginActionEvent,
    UpdateElementActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import { isPluginActiveSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { withActiveElement } from "@webiny/app-page-builder/editor/components";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { Form } from "@webiny/form";
import {
    PbEditorPageElementAdvancedSettingsPlugin,
    PbElement
} from "@webiny/app-page-builder/types";

const emptyElement = { data: {}, type: null };

type AdvancedSettingsPropsType = {
    element: PbElement;
};
const AdvancedSettings: React.FunctionComponent<AdvancedSettingsPropsType> = ({ element }) => {
    const { data, type } = element || cloneDeep(emptyElement);

    const isPluginActive = useRecoilValue(
        isPluginActiveSelector("pb-editor-page-element-settings-advanced")
    );
    const eventActionHandler = useEventActionHandler();

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    const closeDialog = useCallback(() => {
        eventActionHandler.trigger(
            new DeactivatePluginActionEvent({
                name: "pb-editor-page-element-settings-advanced"
            })
        );
    }, []);

    // Get element settings plugins
    const advancedSettingsPlugin = useMemo(() => {
        return plugins
            .byType<PbEditorPageElementAdvancedSettingsPlugin>(
                "pb-editor-page-element-advanced-settings"
            )
            .filter(pl => pl.elementType === element.type);
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
                element: merge(element, "data", formData)
            })
        );
        closeDialog();
    };

    useEffect(() => {
        if (isPluginActive) {
            addKeyHandler("escape", closeDialog);
            return;
        }

        removeKeyHandler("escape");
    }, [isPluginActive]);
    useEffect(() => {
        return () => {
            removeKeyHandler("escape");
        };
    }, []);

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
                        { wrapper: false, filter: pl => pl.elementType === type }
                    )}
                </>
            )}
        </Form>
    );
};

const AdvancedSettingsMemoized = React.memo(AdvancedSettings);

export default withActiveElement({ shallow: true })(AdvancedSettingsMemoized);
