import React from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Dialog, DialogContent, DialogTitle, DialogCancel, DialogActions } from "@webiny/ui/Dialog";
import { i18n } from "@webiny/app/i18n";
import { FbFormModelField, FbFormSubmissionData } from "~/types";

const t = i18n.namespace("FormEditor.FormSubmissionDialog");

const dialogBody = css({
    "&.webiny-ui-dialog__content": {
        marginTop: 0,
        padding: "25",
        div: {
            padding: "5px 0"
        }
    }
});

interface FormSubmissionDialogProps {
    formSubmission: FbFormSubmissionData;
    onClose: () => void;
}

const getFieldValueLabel = (field: FbFormModelField, value: string): string => {
    if (field.options.length > 0) {
        const selectedOption = field.options.find(option => option.value === value);
        if (selectedOption) {
            return selectedOption.label;
        }
    }

    return value;
};

const renderFieldValueLabel = (field: FbFormModelField, value: string): string => {
    if (Array.isArray(value)) {
        return value.map(v => getFieldValueLabel(field, v)).join(", ");
    }

    return getFieldValueLabel(field, value);
};

const FormSubmissionDialog: React.FC<FormSubmissionDialogProps> = ({ formSubmission, onClose }) => {
    return (
        <Dialog open={!!formSubmission} onClose={onClose}>
            {formSubmission && (
                <>
                    <DialogTitle>{t`Form Submission`}</DialogTitle>

                    <DialogContent className={dialogBody}>
                        <div>
                            {formSubmission.form.layout.map(row => {
                                return row.map(id => {
                                    const field = formSubmission.form.fields.find(
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
                                            <Typography use="overline">{field.label}: </Typography>
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
