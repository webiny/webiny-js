// @flow
import React from "react";
import { css } from "emotion";
import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogHeaderTitle,
    DialogCancel,
    DialogFooter
} from "webiny-ui/Dialog";
import { Typography } from "webiny-ui/Typography";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.FormSubmissionDialog");

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: "0",
        dl: {
            padding: 25,
            dd: {
                marginBottom: 10
            }
        }
    }
});

type Props = {
    formSubmission: ?Object,
    onClose: Function,
    form: Object
};

// TODO: @sven - layout styling
const FormSubmissionDialog = ({ formSubmission, onClose, form }: Props) => {
    return (
        <Dialog open={!!formSubmission} onClose={onClose}>
            {formSubmission && (
                <>
                    <DialogHeader>
                        <DialogHeaderTitle>{t`Form Submission`}</DialogHeaderTitle>
                    </DialogHeader>

                    <DialogBody className={dialogBody}>
                        <div>
                            {form.layout.map(row => {
                                return row.map(id => {
                                    const field = form.fields.find(field => field.id === id);
                                    return (
                                        <div
                                            key={id}
                                            style={{ display: "inline-block", width: `calc(100% / ${row.length})` }}
                                        >
                                            <Typography use="overline">
                                                {field.label.value}
                                            </Typography>
                                            <Typography use="body1">
                                                {formSubmission.data[field.fieldId]}
                                            </Typography>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <DialogCancel onClick={onClose}>{t`Cancel`}</DialogCancel>
                    </DialogFooter>
                </>
            )}
        </Dialog>
    );
};

export default FormSubmissionDialog;
