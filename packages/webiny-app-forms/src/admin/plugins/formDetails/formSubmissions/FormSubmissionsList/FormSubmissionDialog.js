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

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.FormSubmissionDialog");

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: "0"
    }
});

type Props = {
    formSubmission: ?Object,
    onClose: Function
};

const FormSubmissionDialog = ({ formSubmission, onClose }: Props) => {
    console.log(formSubmission); // TODO: Tu su svi podaci
    return (
        <Dialog open={!!formSubmission} onClose={onClose}>
            {formSubmission && (
                <>
                    <DialogHeader>
                        <DialogHeaderTitle>{t`Form Submission`}</DialogHeaderTitle>
                    </DialogHeader>

                    <DialogBody className={dialogBody}>
                        <ul>
                            {Object.keys(formSubmission.data).map(key => {
                                return (
                                    <li key={key}>
                                        {key}: {formSubmission.data[key]}
                                    </li>
                                );
                            })}
                        </ul>
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
