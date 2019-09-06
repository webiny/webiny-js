// @flow
import React, { useState, useEffect, useCallback } from "react";
import { cloneDeep } from "lodash";
import { css } from "emotion";
import styled from "@emotion/styled";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogCancel,
    DialogActions,
    DialogButton
} from "@webiny/ui/Dialog";
import { Form } from "@webiny/form";
import { getPlugins } from "@webiny/plugins";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import GeneralTab from "./EditFieldDialog/GeneralTab";
import ValidatorsTab from "./EditFieldDialog/ValidatorsTab";
import FieldTypeSelector from "./EditFieldDialog/FieldTypeSelector";
import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormEditor.EditFieldDialog");
import { useFormEditor } from "@webiny/app-forms/admin/components/FormEditor/Context";
import { useI18N } from "@webiny/app-i18n/context";

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: "0"
    }
});

const FieldTypeList = styled("div")({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    paddingTop: 25,
    backgroundColor: "var(--mdc-theme-background) !important"
});

type Props = {
    field: ?Object,
    onClose: Function,
    onSubmit: Function
};

const EditFieldDialog = ({ field, onSubmit, ...props }: Props) => {
    const [current, setCurrent] = useState(null);
    const [isNewField, setIsNewField] = useState(false);
    const [screen, setScreen] = useState();

    const { getFieldPlugin } = useFormEditor();
    const i18n = useI18N();

    useEffect(() => {
        setCurrent(cloneDeep(field));
        if (field) {
            setIsNewField(!field._id);
            setScreen(field.type ? "fieldOptions" : "fieldType");
        }
    }, [field]);

    const onClose = useCallback(() => {
        setCurrent(null);
        props.onClose();
    });

    let render = null;
    let headerTitle = t`Field Settings`;

    if (current) {
        const fieldPlugin = getFieldPlugin({ name: current.name });
        if (fieldPlugin) {
            headerTitle = t`Field Settings - {fieldTypeLabel}`({
                fieldTypeLabel: fieldPlugin.field.label
            });
        }

        switch (screen) {
            case "fieldOptions": {
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
                                                setScreen={setScreen}
                                            />
                                        </Tab>
                                        {Array.isArray(fieldPlugin.field.validators) &&
                                            fieldPlugin.field.validators.length > 0 && (
                                                <Tab label={"Validators"}>
                                                    <ValidatorsTab
                                                        form={form}
                                                        field={current}
                                                        setScreen={setScreen}
                                                    />
                                                </Tab>
                                            )}
                                    </Tabs>
                                </DialogContent>
                                <DialogActions
                                    style={{
                                        justifyContent: isNewField ? "space-between" : "flex-end"
                                    }}
                                >
                                    {isNewField && (
                                        <DialogButton onClick={() => setScreen("fieldType")}>
                                            {t`Go back`}
                                        </DialogButton>
                                    )}
                                    <div>
                                        <DialogButton onClick={onClose}>{t`Cancel`}</DialogButton>
                                        <DialogButton onClick={form.submit}>{t`Save`}</DialogButton>
                                    </div>
                                </DialogActions>
                            </>
                        )}
                    </Form>
                );
                break;
            }
            default:
                render = (
                    <>
                        <DialogContent className={dialogBody}>
                            <FieldTypeList>
                                {getPlugins("form-editor-field-type")
                                    .filter(pl => !pl.field.group)
                                    .map(pl => (
                                        <FieldTypeSelector
                                            key={pl.name}
                                            fieldType={pl.field}
                                            onClick={() => {
                                                const newCurrent = pl.field.createField({
                                                    i18n
                                                });
                                                if (current) {
                                                    // User edited existing field, that's why we still want to
                                                    // keep a couple of previous values.
                                                    const {
                                                        _id,
                                                        label,
                                                        fieldId,
                                                        helpText
                                                    } = current;
                                                    newCurrent._id = _id;
                                                    newCurrent.label = label;
                                                    newCurrent.fieldId = fieldId;
                                                    newCurrent.helpText = helpText;
                                                }
                                                setCurrent(newCurrent);
                                                setScreen("fieldOptions");
                                            }}
                                        />
                                    ))}
                            </FieldTypeList>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel onClick={onClose}>{t`Cancel`}</DialogCancel>
                        </DialogActions>
                    </>
                );
        }
    }

    return (
        <Dialog preventOutsideDismiss={true} open={!!current} onClose={onClose}>
            <DialogTitle>{headerTitle}</DialogTitle>
            {render}
        </Dialog>
    );
};

export default EditFieldDialog;
