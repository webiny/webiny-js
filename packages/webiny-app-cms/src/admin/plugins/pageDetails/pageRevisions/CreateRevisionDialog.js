// @flow
import React from "react";
import { css } from "emotion";
import { Dialog, DialogBody, DialogFooter, DialogAccept, DialogCancel } from "webiny-ui/Dialog";
import { Input } from "webiny-ui/Input";
import { Form } from "webiny-form";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    revisions: Array<{ version: number }>
};

const CreateRevisionDialog = ({ open, onClose, onSubmit, revisions }: Props) => {
    const version = Math.max(...revisions.map(r => r.version));
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Form data={{ name: `Revision #${version + 1}` }} onSubmit={onSubmit}>
                {({ submit, Bind }) => (
                    <React.Fragment>
                        <DialogBody>
                            <Bind name={"name"} validators={["required"]}>
                                <Input autoFocus label={"Revision name"} />
                            </Bind>
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogAccept onClick={submit}>Create revision</DialogAccept>
                        </DialogFooter>
                    </React.Fragment>
                )}
            </Form>
        </Dialog>
    );
};

export default CreateRevisionDialog;
