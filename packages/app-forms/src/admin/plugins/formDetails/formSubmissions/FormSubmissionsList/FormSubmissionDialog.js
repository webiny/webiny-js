// @flow
import React from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { I18NValue } from "@webiny/app-i18n/components";
import { Dialog, DialogContent, DialogTitle, DialogCancel, DialogActions } from "@webiny/ui/Dialog";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormEditor.FormSubmissionDialog");

const dialogBody = css({
    "&.mdc-dialog__body": {
        marginTop: 0,
        padding: "25",
        div: {
            padding: "5px 0"
        }
    }
});

type Props = {
    formSubmission: Object,
    onClose: Function
};

const getFieldValueLabel = (field, value) => {
    if (field.options.length > 0) {
        const selectedOption = field.options.find(option => option.value === value);
        if (selectedOption) {
            return I18NValue(selectedOption.label);
        }
    }

    return value;
};

const renderFieldValueLabel = (field, value) => {
    if (Array.isArray(value)) {
        return value.map(v => getFieldValueLabel(field, v)).join(", ");
    }

    return getFieldValueLabel(field, value);
};

const FormSubmissionDialog = ({ formSubmission, onClose }: Props) => {
    return (
        <Dialog open={!!formSubmission} onClose={onClose}>
            {formSubmission && (
                <>
                    <DialogTitle>{t`Form Submission`}</DialogTitle>

                    <DialogContent className={dialogBody}>
                        <div>
                            {formSubmission.form.revision.layout.map(row => {
                                return row.map(id => {
                                    const field = formSubmission.form.revision.fields.find(
                                        field => field._id === id
                                    );

                                    return (
                                        <div
                                            key={id}
                                            style={{
                                                display: "inline-block",
                                                width: `calc(100% / ${row.length})`
                                            }}
                                        >
                                            <Typography use="overline">
                                                {field.label.value}:{" "}
                                            </Typography>
                                            <Typography use="body1">
                                                {field.type === "textarea" ? (
                                                    <pre>
                                                        {renderFieldValueLabel(
                                                            field,
                                                            formSubmission.data[field.fieldId]
                                                        )}
                                                    </pre>
                                                ) : (
                                                    renderFieldValueLabel(
                                                        field,
                                                        formSubmission.data[field.fieldId]
                                                    )
                                                )}
                                            </Typography>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={onClose}>{t`Cancel`}</DialogCancel>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default FormSubmissionDialog;
