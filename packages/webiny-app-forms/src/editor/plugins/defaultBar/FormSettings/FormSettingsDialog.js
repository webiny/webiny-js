import React, { Fragment } from "react";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.FormSettingsDialog");

import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogHeaderTitle,
    DialogCancel,
    DialogFooter,
    DialogFooterButton
} from "webiny-ui/Dialog";

import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";

export const FormSettingsDialog = ({ open, onClose }) => {
    const { state } = useFormEditor();

    return (
        <Dialog open={open} onClose={onClose}>
            <Form data={state.settings} onSubmit={() => {}}>
                {({ Bind, submit }) => (
                    <Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>{t`Form Settings`}</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Grid>
                                <Cell span={12}>
                                    <Bind name={"successMessage"}>
                                        <Input label={t`Success message`} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"submitButtonLabel"}>
                                        <Input label={t`Submit button label`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel>{t`Cancel`}</DialogCancel>
                            <DialogFooterButton onClick={submit}>{t`Save`}</DialogFooterButton>
                        </DialogFooter>
                    </Fragment>
                )}
            </Form>
        </Dialog>
    );
};
