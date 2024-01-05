import React from "react";
import { css } from "emotion";
import { Form, FormOnSubmit } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
/**
 * Package react-hotkeys does not have types.
 */
// @ts-expect-error
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

interface EditFieldOptionDialogProps<T = any> {
    option: any;
    optionIndex: number;
    open: boolean;
    onClose: () => void;
    onSubmit: FormOnSubmit<T>;
    options: any[];
}

const EditFieldOptionDialog = (props: EditFieldOptionDialogProps) => {
    const { onClose, options, open, onSubmit, option, optionIndex } = props;

    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            {option !== null && (
                <Hotkeys
                    zIndex={115}
                    keys={{
                        esc(event: React.KeyboardEvent) {
                            event.preventDefault();
                            event.stopPropagation();
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
                                                <Input label={t`Label`} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name={"value"}
                                                validators={(value: string) => {
                                                    validation.validateSync(value, "required");
                                                    if (Array.isArray(options) === false) {
                                                        return true;
                                                    }

                                                    for (let key = 0; key < options.length; key++) {
                                                        const current = options[key];
                                                        if (
                                                            current.value === value &&
                                                            key !== optionIndex
                                                        ) {
                                                            throw new Error(
                                                                `Option with value "${value}" already exists.`
                                                            );
                                                        }
                                                    }
                                                    return true;
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
