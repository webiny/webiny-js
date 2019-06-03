// @flow
import React from "react";
import { css } from "emotion";
import { withRouter } from "react-router-dom";
import type { RouterHistory } from "react-router-dom";
import { Mutation } from "react-apollo";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { createForm } from "webiny-app-forms/admin/graphql/forms";
import {
    Dialog,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter
} from "webiny-ui/Dialog";
import { ButtonDefault } from "webiny-ui/Button";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

const NewFormDialog = ({
    open,
    onClose,
    history
}: {
    open: boolean,
    onClose: Function,
    history: RouterHistory
}) => {
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Mutation mutation={createForm}>
                {update => (
                    <Form
                        onSubmit={async data => {
                            const result = update({ variables: data });
                            // history.push("/forms")
                        }}
                    >
                        {({ Bind, submit }) => (
                            <>
                                <DialogHeader>
                                    <DialogHeaderTitle>New form</DialogHeaderTitle>
                                </DialogHeader>
                                <DialogBody>
                                    <Bind name={"name"}>
                                        <Input />
                                    </Bind>
                                </DialogBody>
                                <DialogFooter>
                                    <ButtonDefault onClick={submit}>+ Create</ButtonDefault>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                )}
            </Mutation>
        </Dialog>
    );
};

export default withRouter(NewFormDialog);
