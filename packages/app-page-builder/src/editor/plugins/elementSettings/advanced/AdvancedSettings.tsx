import React, { useCallback, useEffect } from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import {
    DeactivatePluginActionEvent,
    UpdateElementActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import { isPluginActiveSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { cloneDeep } from "lodash";
import { merge } from "dot-prop-immutable";
import { getPlugins } from "@webiny/plugins";
import { renderPlugins } from "@webiny/app/plugins";
import { withActiveElement } from "@webiny/app-page-builder/editor/components";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { css } from "emotion";
import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogButton,
    DialogCancel,
    DialogTitle
} from "@webiny/ui/Dialog";
import { Form } from "@webiny/form";
import { Tabs } from "@webiny/ui/Tabs";
import {
    PbEditorPageElementAdvancedSettingsPlugin,
    PbElement
} from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const emptyElement = { data: {}, type: null };

const dialogStyle = css({
    ".mdc-dialog__surface": {
        maxWidth: 865
    },
    ".webiny-ui-dialog__content": {
        width: 865,
        maxHeight: "70vh"
    }
});

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

    const onSubmit = (formData: FormData) => {
        // Get element settings plugins
        const plugins = getPlugins<PbEditorPageElementAdvancedSettingsPlugin>(
            "pb-editor-page-element-advanced-settings"
        ).filter(pl => pl.elementType === element.type);

        formData = plugins.reduce((formData, pl) => {
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

    // const onSubmit = useHandler(props, ({ element, updateElement }) => (formData: FormData) => {
    //     // Get element settings plugins
    //     const plugins = getPlugins<PbEditorPageElementAdvancedSettingsPlugin>(
    //         "pb-editor-page-element-advanced-settings"
    //     ).filter(pl => pl.elementType === element.type);
    //
    //     formData = plugins.reduce((formData, pl) => {
    //         if (pl.onSave) {
    //             return pl.onSave(formData);
    //         }
    //         return formData;
    //     }, formData);
    //
    //     updateElement({
    //         element: merge(element, "data", formData)
    //     });
    //     closeDialog();
    // });

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

    return (
        <Dialog
            open={isPluginActive}
            onClose={closeDialog}
            className={dialogStyle}
            data-testid={"pb-editor-advanced-element-settings-dialog"}
        >
            <DialogTitle>Settings</DialogTitle>
            <Form key={element && element.id} data={data} onSubmit={onSubmit}>
                {({ submit, Bind, data, form }) => (
                    <>
                        <DialogContent>
                            <Tabs>
                                {renderPlugins<PbEditorPageElementAdvancedSettingsPlugin>(
                                    "pb-editor-page-element-advanced-settings",
                                    { Bind, data, form },
                                    { wrapper: false, filter: pl => pl.elementType === type }
                                )}
                            </Tabs>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogButton onClick={submit}>Save</DialogButton>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

// const withConnect = connect<any, any, any>(
//     state => ({
//         open: isPluginActive("pb-editor-page-element-settings-advanced")(state)
//     }),
//     { updateElement, deactivatePlugin }
// );

const AdvancedSettingsMemoized = React.memo(AdvancedSettings);

export default withActiveElement({ shallow: true })(AdvancedSettingsMemoized);

// export default withConnect(
//     withActiveElement({ shallow: true })(
//         React.memo(AdvancedSettings, (prev, next) => prev.open === next.open)
//     )
// );
