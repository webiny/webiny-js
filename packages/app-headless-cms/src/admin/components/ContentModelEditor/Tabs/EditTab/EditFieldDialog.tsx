import React, { useState, useEffect, useCallback } from "react";
import { cloneDeep } from "lodash";
import { css } from "emotion";
import { Dialog, DialogContent, DialogTitle, DialogActions, DialogButton } from "@webiny/ui/Dialog";
import { Form } from "@webiny/form";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import GeneralTab from "./EditFieldDialog/GeneralTab";
import ValidatorsTab from "./EditFieldDialog/ValidatorsTab";
import AppearanceTab from "./EditFieldDialog/AppearanceTab";
import PredefinedValuesTab from "./EditFieldDialog/PredefinedValuesTab";
import { i18n } from "@webiny/app/i18n";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { CmsEditorField, CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { getPlugins } from "@webiny/plugins";
const t = i18n.namespace("app-headless-cms/admin/components/editor");

const dialogBody = css({
    "&.webiny-ui-dialog__content": {
        width: 875,
        height: 450
    }
});

type EditFieldDialogProps = {
    field: CmsEditorField;
    onClose: Function;
    onSubmit: (data: any) => void;
};

const EditFieldDialog = ({ field, onSubmit, ...props }: EditFieldDialogProps) => {
    const [current, setCurrent] = useState(null);

    const { getFieldPlugin } = useContentModelEditor();

    useEffect(() => {
        if (!field) {
            return setCurrent(field);
        }

        const clonedField = cloneDeep(field);

        if (!clonedField.renderer || !clonedField.renderer.name) {
            const [renderPlugin] = getPlugins<CmsEditorFieldRendererPlugin>(
                "cms-editor-field-renderer"
            ).filter(item => item.renderer.canUse({ field }));

            if (renderPlugin) {
                clonedField.renderer = { name: renderPlugin.renderer.rendererName };
            }
        }

        setCurrent(clonedField);
    }, [field]);

    const onClose = useCallback(() => {
        setCurrent(null);
        props.onClose();
    }, undefined);

    let render = null;
    let headerTitle = t`Field Settings`;

    if (current) {
        const fieldPlugin = getFieldPlugin({ type: current.type });
        if (fieldPlugin) {
            headerTitle = t`Field Settings - {fieldTypeLabel}`({
                fieldTypeLabel: fieldPlugin.field.label
            });
        }

        render = (
            <Form data={current} onSubmit={onSubmit}>
                {form => (
                    <>
                        <DialogContent className={dialogBody}>
                            <Tabs>
                                <Tab label={t`General`}>
                                    <GeneralTab
                                        form={form}
                                        field={current}
                                        fieldPlugin={fieldPlugin}
                                    />
                                </Tab>

                               {/* TODO: Add predefined values functionality.
                                {fieldPlugin.field.allowPredefinedValues &&
                                    typeof fieldPlugin.field.renderPredefinedValues ===
                                        "function" && (
                                        <Tab label={t`Predefined Values`}>
                                            <PredefinedValuesTab
                                                form={form}
                                                field={current}
                                                fieldPlugin={fieldPlugin}
                                            />
                                        </Tab>
                                    )}*/}

                                {/* TODO: Add validators functionality.
                                {Array.isArray(fieldPlugin.field.validators) &&
                                    fieldPlugin.field.validators.length > 0 && (
                                        <Tab label={"Validators"}>
                                            <ValidatorsTab
                                                form={form}
                                                field={current}
                                                fieldPlugin={fieldPlugin}
                                            />
                                        </Tab>
                                    )}*/}
                                <Tab label={t`Appearance`}>
                                    <AppearanceTab
                                        form={form}
                                        field={current}
                                        fieldPlugin={fieldPlugin}
                                    />
                                </Tab>
                            </Tabs>
                        </DialogContent>
                        <DialogActions
                            style={{
                                justifyContent: "flex-end"
                            }}
                        >
                            <div>
                                <DialogButton onClick={onClose}>{t`Cancel`}</DialogButton>
                                <DialogButton onClick={form.submit}>{t`Save`}</DialogButton>
                            </div>
                        </DialogActions>
                    </>
                )}
            </Form>
        );
    }

    return (
        <Dialog preventOutsideDismiss open={!!current} onClose={onClose}>
            <DialogTitle>{headerTitle}</DialogTitle>
            {render}
        </Dialog>
    );
};

export default EditFieldDialog;
