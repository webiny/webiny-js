// @flow
import React from "react";
import { css } from "emotion";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogAccept,
    DialogCancel
} from "@webiny/ui/Dialog";
import { Select } from "@webiny/ui/Select";
import { Form } from "@webiny/form";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    revisions: Array<Object>,
    selected: string
};

const PublishRevisionDialog = ({ open, onClose, onSubmit, revisions, selected }: Props) => {
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Form
                data={{ revision: selected || "" }}
                onSubmit={({ revision }) => onSubmit(revisions.find(r => r.id === revision))}
            >
                {({ submit, Bind }) => (
                    <React.Fragment>
                        <DialogTitle>Select a revision to publish</DialogTitle>
                        <DialogContent>
                            <Bind name={"revision"} validators={["required"]}>
                                <Select label={"Revision to publish"}>
                                    {revisions.filter(r => !r.published).map(rev => (
                                        <option key={rev.id} value={rev.id}>
                                            {rev.title} (#
                                            {rev.version})
                                        </option>
                                    ))}
                                </Select>
                            </Bind>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogAccept onClick={submit}>Publish</DialogAccept>
                        </DialogActions>
                    </React.Fragment>
                )}
            </Form>
        </Dialog>
    );
};

export default PublishRevisionDialog;
