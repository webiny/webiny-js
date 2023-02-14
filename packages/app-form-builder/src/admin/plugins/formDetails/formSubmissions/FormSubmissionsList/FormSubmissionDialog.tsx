import React from "react";
import { css } from "emotion";
import { parse } from "json2csv";
import { Typography } from "@webiny/ui/Typography";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Dialog, DialogContent, DialogTitle, DialogCancel, DialogActions } from "@webiny/ui/Dialog";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import { ReactComponent as ObjectIcon } from "@material-design-icons/svg/outlined/data_object.svg";
import { ReactComponent as TableIcon } from "@material-design-icons/svg/outlined/table_rows.svg";
import { FbFormModelField, FbFormSubmissionData } from "~/types";

const t = i18n.namespace("FormEditor.FormSubmissionDialog");

const dialogStyle = css`
    .webiny-ui-dialog__title {
        position: relative;

        .title-actions {
            position: absolute;
            top: 10px;
            right: 10px;

            &:focus-visible {
                outline: none;
            }

            svg {
                fill: white;
            }
        }
    }

    .webiny-ui-dialog__content {
        min-width: 400px;
        margin-top: 0;
        padding: 25px;
        div {
            padding: 5px 0;
        }
    }
`;

interface FormSubmissionDialogProps {
    formSubmission: FbFormSubmissionData | null;
    onClose: () => void;
}

const getFieldValueLabel = (field: FbFormModelField, value: string): string => {
    const options = field.options || [];
    if (options.length > 0) {
        const selectedOption = options.find(option => option.value === value);
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
    const { showSnackbar } = useSnackbar();

    return (
        <Dialog open={!!formSubmission} onClose={onClose} className={dialogStyle}>
            {formSubmission && (
                <>
                    <DialogTitle>
                        {t`Form Submission`}
                        <div className="title-actions" tabIndex={0}>
                            <Tooltip content="Copy as JSON" placement={"top"}>
                                <IconButton
                                    icon={<ObjectIcon />}
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            JSON.stringify(formSubmission.data, null, 2)
                                        );
                                        showSnackbar("JSON data copied to clipboard.");
                                    }}
                                />
                            </Tooltip>
                            <Tooltip content="Copy as CSV" placement={"top"}>
                                <IconButton
                                    icon={<TableIcon />}
                                    onClick={() => {
                                        navigator.clipboard.writeText(parse(formSubmission.data));
                                        showSnackbar("CSV data copied to clipboard.");
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </DialogTitle>

                    <DialogContent>
                        <div>
                            {formSubmission.form.layout.map(row => {
                                return row.map(id => {
                                    const field = formSubmission.form.fields.find(
                                        field => field._id === id
                                    );
                                    if (!field) {
                                        return null;
                                    }

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
                        <DialogCancel onClick={onClose}>{t`Close`}</DialogCancel>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default FormSubmissionDialog;
