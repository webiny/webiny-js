import React, { useCallback, Fragment } from "react";
import { css } from "emotion";
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
import { Elevation } from "webiny-ui/Elevation";
import { Typography } from "webiny-ui/Typography";
import { Icon } from "webiny-ui/Icon";
import GeneralTab from "./GeneralTab";
import ValidatorsTab from "./ValidatorsTab";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.EditFieldDialog");

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: "24px 0 0 0"
    }
});

function getFieldType() {
    const plugin = editField
        ? getPlugins("form-editor-field-type").find(pl => pl.fieldType.id === editField.type)
        : null;

    return plugin ? plugin.fieldType : null;
}

const Thumbnail = ({ fieldType, onClick }) => {
    return (
        <Elevation z={2} onClick={onClick}>
            <Icon icon={fieldType.icon} />
            <Typography use={"headline5"}>{fieldType.label}</Typography>
            <Typography use={"caption"}>{fieldType.description}</Typography>
        </Elevation>
    );
};

const EditFieldDialog = () => {
    const { editField, getEditingField, saveField } = useFormEditor();
    // const fieldType = getFieldType();

    const onClose = () => editField(null);
    const editedField = getEditingField();

    return (
        <Dialog open={editedField} onClose={onClose}>
            <DialogHeader>
                <DialogHeaderTitle>{t`Field Settings`}</DialogHeaderTitle>
            </DialogHeader>

            {editedField &&
                (editedField.id ? (
                    <Form
                        submitOnEnter
                        data={editedField}
                        onSubmit={data => {
                            saveField(data);
                            editField(null);
                        }}
                    >
                        {form => (
                            <Fragment>
                                <DialogBody className={dialogBody}>
                                    <Tabs>
                                        <Tab label={t`General`}>
                                            <GeneralTab form={form} />
                                        </Tab>
                                        <Tab label={"Validators"}>
                                            {/*<Bind name={"validation"}>
                                                <ValidatorsTab formProps={formProps} />
                                            </Bind>*/}
                                        </Tab>
                                    </Tabs>
                                </DialogBody>
                                <DialogFooter>
                                    <DialogFooterButton onClick={onClose}>
                                        {t`Cancel`}
                                    </DialogFooterButton>
                                    <DialogFooterButton
                                        onClick={form.submit}
                                    >{t`Save`}</DialogFooterButton>
                                </DialogFooter>
                            </Fragment>
                        )}
                    </Form>
                ) : (
                    <>
                        <DialogBody className={dialogBody}>
                            {getPlugins("form-editor-field-type")
                                .filter(pl => pl.fieldType.dataType)
                                .map(pl => (
                                    <Thumbnail
                                        key={pl.name}
                                        fieldType={pl.fieldType}
                                        onClick={() => setField(pl.fieldType.createField())}
                                    />
                                ))}
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel onClick={onClose}>Cancel</DialogCancel>
                        </DialogFooter>
                    </>
                ))}
        </Dialog>
    );
};

export default EditFieldDialog;
