import React, { useState, useEffect, useCallback } from "react";
import { cloneDeep } from "lodash";
import { css } from "emotion";
import { Dialog, DialogContent, DialogTitle, DialogActions, DialogButton } from "@webiny/ui/Dialog";
import { Form } from "@webiny/form";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import GeneralTab from "./EditFieldDialog/GeneralTab";
import ValidatorsTab from "./EditFieldDialog/ValidatorsTab";
import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("ContentModelEditor.EditFieldDialog");
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";

const dialogBody = css({
    "&.webiny-ui-dialog__content": {
        width: 875,
        height: 450
    }
});

type EditFieldDialogProps = {
    field: CmsContentModelModelField;
    onClose: Function;
    onSubmit: (data: any) => void;
};

const EditFieldDialog = ({ field, onSubmit, ...props }: EditFieldDialogProps) => {
    const [current, setCurrent] = useState(null);
    const [isNewField, setIsNewField] = useState(false);

    const { getFieldPlugin } = useContentModelEditor();

    useEffect(() => {
        setCurrent(cloneDeep(field));
        if (field) {
            setIsNewField(!field._id);
        }
    }, [field]);

    const onClose = useCallback(() => {
        setCurrent(null);
        props.onClose();
    }, undefined);

    let render = null;
    let headerTitle = t`Field Settings`;

    if (current) {
        const fieldPlugin = getFieldPlugin({ name: current.name });
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
                                    <GeneralTab form={form} field={current} />
                                </Tab>
                                {Array.isArray(fieldPlugin.field.validators) &&
                                    fieldPlugin.field.validators.length > 0 && (
                                        <Tab label={"Validators"}>
                                            <ValidatorsTab form={form} field={current} />
                                        </Tab>
                                    )}
                            </Tabs>
                        </DialogContent>
                        <DialogActions
                            style={{
                                justifyContent: isNewField ? "space-between" : "flex-end"
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
