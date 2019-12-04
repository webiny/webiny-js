// @flow
import React from "react";
import { css } from "emotion";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { i18n } from "@webiny/app/i18n";
import { Hotkeys } from "react-hotkeyz";
import { validation } from "@webiny/validation";

import { Dialog, DialogTitle, DialogContent, DialogActions, DialogButton } from "@webiny/ui/Dialog";

const t = i18n.namespace("Forms.FormEditor.EditFieldOptionDialog");
const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

const EditFieldOptionDialog = (props: {
    option: Object,
    optionIndex: number,
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    options: Array<Object>
}) => {
    const { onClose, options, open, onSubmit, option, optionIndex } = props;

    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            {option !== null && (
                <Hotkeys
                    zIndex={115}
                    keys={{
                        esc(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }
                    }}
                >
                    <Form data={option} onSubmit={onSubmit}>
                        {({ Bind, submit }) => (
                            <>
                                <DialogTitle>{t`Edit option`}</DialogTitle>
                                <DialogContent>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"label"}>
                                                <I18NInput
                                                    label={t`Label`}
                                                    showTranslateIcon={false}
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name={"value"}
                                                validators={value => {
                                                    validation.validateSync(value, "required");
                                                    if (!Array.isArray(options)) {
                                                        return true;
                                                    }

                                                    for (let i = 0; i < options.length; i++) {
                                                        let current = options[i];
                                                        if (
                                                            current.value === value &&
                                                            i !== optionIndex
                                                        ) {
                                                            throw new Error(
                                                                `Option with value "${value}" already exists.`
                                                            );
                                                        }
                                                    }
                                                }}
                                            >
                                                <Input label={t`Value`} />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </DialogContent>
                                <DialogActions>
                                    <DialogButton onClick={submit}>{t`Save`}</DialogButton>
                                </DialogActions>
                            </>
                        )}
                    </Form>
                </Hotkeys>
            )}
        </Dialog>
    );
};

export default EditFieldOptionDialog;
