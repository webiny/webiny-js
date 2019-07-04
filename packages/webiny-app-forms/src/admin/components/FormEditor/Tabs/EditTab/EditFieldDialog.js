// @flow
import React, { useState, useEffect, useCallback } from "react";
import { cloneDeep } from "lodash";
import { css } from "emotion";
import styled from "react-emotion";
import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogHeaderTitle,
    DialogCancel,
    DialogFooter,
    DialogFooterButton
} from "webiny-ui/Dialog";
import { Form } from "webiny-form";
import { getPlugins } from "webiny-plugins";
import { Tabs, Tab } from "webiny-ui/Tabs";
import GeneralTab from "./EditFieldDialog/GeneralTab";
import ValidatorsTab from "./EditFieldDialog/ValidatorsTab";
import FieldTypeSelector from "./EditFieldDialog/FieldTypeSelector";
import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.EditFieldDialog");

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
    // const fieldType = getFieldType();
    const [current, setCurrent] = useState(null);
    const [isNewField, setIsNewField] = useState(false);
    const [screen, setScreen] = useState();

    useEffect(() => {
        if (!field) {
            return;
        }

        setCurrent(cloneDeep(field));
        setIsNewField(!field._id);
        setScreen(field.type ? "fieldOptions" : "fieldType");
    }, [field]);

    const onClose = useCallback(() => {
        setCurrent(null);
        props.onClose();
    });

    let render = null;
    if (current) {
        switch (screen) {
            case "fieldOptions": {
                render = (
                    <Form submitOnEnter data={current} onSubmit={onSubmit}>
                        {form => {
                            const { Bind } = form;
                            return (
                                <>
                                    <DialogBody className={dialogBody}>
                                        <Tabs>
                                            <Tab label={t`General`}>
                                                <GeneralTab
                                                    form={form}
                                                    field={current}
                                                    setScreen={setScreen}
                                                />
                                            </Tab>
                                            {!!current.validators && (
                                                <Tab label={"Validators"}>
                                                    <Bind name={"validation"}>
                                                        <ValidatorsTab
                                                            form={form}
                                                            field={current}
                                                            setScreen={setScreen}
                                                        />
                                                    </Bind>
                                                </Tab>
                                            )}
                                        </Tabs>
                                    </DialogBody>
                                    <DialogFooter>
                                        {isNewField && (
                                            <DialogFooterButton
                                                onClick={() => setScreen("fieldType")}
                                            >
                                                {t`Go back`}
                                            </DialogFooterButton>
                                        )}
                                        <DialogFooterButton onClick={onClose}>
                                            {t`Cancel`}
                                        </DialogFooterButton>
                                        <DialogFooterButton onClick={form.submit}>
                                            {t`Save`}
                                        </DialogFooterButton>
                                    </DialogFooter>
                                </>
                            );
                        }}
                    </Form>
                );
                break;
            }
            default:
                render = (
                    <>
                        <DialogBody className={dialogBody}>
                            <FieldTypeList>
                                {getPlugins("form-editor-field-type")
                                    .filter(pl => pl.fieldType.dataType)
                                    .map(pl => (
                                        <FieldTypeSelector
                                            key={pl.name}
                                            fieldType={pl.fieldType}
                                            isCurrentFieldType={
                                                current && current.type === pl.fieldType.id
                                            }
                                            onClick={() => {
                                                const newCurrent = pl.fieldType.createField();
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
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel onClick={onClose}>{t`Cancel`}</DialogCancel>
                        </DialogFooter>
                    </>
                );
        }
    }

    return (
        <Dialog preventOutsideDismiss={true} open={!!current} onClose={onClose}>
            <DialogHeader>
                <DialogHeaderTitle>{t`Field Settings`}</DialogHeaderTitle>
            </DialogHeader>
            {render}
        </Dialog>
    );
};

export default EditFieldDialog;
