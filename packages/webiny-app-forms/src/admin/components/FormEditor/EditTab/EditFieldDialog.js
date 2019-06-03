import React, { Fragment } from "react";
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
import useEditFieldDialog from "./useEditFieldDialog";
import GeneralTab from "./GeneralTab";
import ValidatorsTab from "./ValidatorsTab";

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: "24px 0 0 0"
    }
});

const Thumbnail = ({ fieldType, onClick }) => {
    return (
        <Elevation z={2} onClick={onClick}>
            <Icon icon={fieldType.icon} />
            <Typography use={"headline5"}>{fieldType.label}</Typography>
            <Typography use={"caption"}>{fieldType.description}</Typography>
        </Elevation>
    );
};

const EditFieldDialog = ({ open, field, onClose, onSave }) => {
    const hook = useEditFieldDialog({ open, field });
    const { getFieldType, createSlugify, uniqueId, editField, setField } = hook;

    const fieldType = getFieldType();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogHeader>
                <DialogHeaderTitle>Field Settings</DialogHeaderTitle>
            </DialogHeader>
            {/* If `editField` is not present, show data type fields. */}
            {!editField && (
                <Fragment>
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
                </Fragment>
            )}

            {editField && (
                <Form
                    submitOnEnter
                    data={editField}
                    onSubmit={data => {
                        onSave(data);
                        onClose();
                    }}
                >
                    {(formProps) => {
                        const { setValue, submit, Bind } = formProps;
                        const slugify = createSlugify(setValue);

                        return (
                            <Fragment>
                                <DialogBody className={dialogBody}>
                                    <Tabs>
                                        <Tab label={"General"}>
                                            <GeneralTab
                                                fieldType={fieldType}
                                                Bind={Bind}
                                                slugify={slugify}
                                                uniqueId={uniqueId}
                                            />
                                        </Tab>
                                        <Tab label={"Validators"}>
                                            <Bind name={"validation"}>
                                                <ValidatorsTab formProps={formProps} field={editField} />
                                            </Bind>
                                        </Tab>
                                    </Tabs>
                                </DialogBody>
                                <DialogFooter>
                                    <DialogFooterButton onClick={onClose}>
                                        Cancel
                                    </DialogFooterButton>
                                    <DialogFooterButton onClick={submit}>Save</DialogFooterButton>
                                </DialogFooter>
                            </Fragment>
                        );
                    }}
                </Form>
            )}
        </Dialog>
    );
};

export default EditFieldDialog;
