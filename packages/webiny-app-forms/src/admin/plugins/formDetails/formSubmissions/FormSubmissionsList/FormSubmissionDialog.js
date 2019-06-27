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

const FormSubmissionDialog = ({ formSubmission, onClose, form }: Props) => {
    return (
        <Dialog open={!!formSubmission} onClose={onClose}>
            {formSubmission && (
                <>
                    <DialogHeader>
                        <DialogHeaderTitle>{t`Form Submission`}</DialogHeaderTitle>
                    </DialogHeader>

                    <DialogBody className={dialogBody}>
                        <dl>
                            {Object.keys(formSubmission.data).map(fieldId => {
                                const field = form.fields.find(field => field.fieldId === fieldId);
                                return (
                                    <React.Fragment key={fieldId}>
                                        <dt key={fieldId}>
                                            <Typography use="overline">{field.label.value}</Typography>
                                        </dt>
                                        <dd>
                                            <Typography use="body1">
                                                {formSubmission.data[fieldId]}
                                            </Typography>
                                        </dd>
                                    </React.Fragment>
                                );
                            })}
                        </dl>
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
