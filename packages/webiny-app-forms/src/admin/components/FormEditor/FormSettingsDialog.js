import React, { Fragment, useContext } from "react";
import { FormEditorContext } from "./context";

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
    const { formState } = useContext(FormEditorContext);

    return (
        <Dialog open={open} onClose={onClose}>
            <Form data={formState.settings} onSubmit={() => {}}>
                {({ Bind, submit }) => (
                    <Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>Form Settings</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Grid>
                                <Cell span={12}>
                                    <Bind name={"successMessage"}>
                                        <Input label={"Success message"}/>
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"submitButtonLabel"}>
                                        <Input label={"Submit button label"}/>
                                    </Bind>
                                </Cell>
                            </Grid>
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogFooterButton onClick={submit}>Save</DialogFooterButton>
                        </DialogFooter>
                    </Fragment>
                )}
            </Form>
        </Dialog>
    );
};
