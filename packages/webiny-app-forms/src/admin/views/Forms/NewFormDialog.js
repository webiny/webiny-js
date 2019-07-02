// @flow
import React from "react";
import { css } from "emotion";
import { withRouter } from "react-router-dom";
import type { RouterHistory } from "react-router-dom";
import { Mutation } from "react-apollo";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { createForm } from "webiny-app-forms/admin/viewsGraphql";
import get from "lodash.get";
import { compose } from "recompose";
import { withSnackbar } from "webiny-admin/components";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("Forms.NewFormDialog");

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
    history,
    showSnackbar
}: {
    open: boolean,
    onClose: Function,
    history: RouterHistory,
    showSnackbar: Function
}) => {
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Mutation mutation={createForm}>
                {update => (
                    <Form
                        onSubmit={async data => {
                            const response = get(
                                await update({ variables: data }),
                                "data.forms.form"
                            );
                            if (response.error) {
                                return showSnackbar(response.error.message);
                            }

                            history.push("/forms/" + response.data.id);
                        }}
                    >
                        {({ Bind, submit }) => (
                            <>
                                <DialogHeader>
                                    <DialogHeaderTitle>{t`New form`}</DialogHeaderTitle>
                                </DialogHeader>
                                <DialogBody>
                                    <Bind name={"name"}>
                                        <Input />
                                    </Bind>
                                </DialogBody>
                                <DialogFooter>
                                    <ButtonDefault onClick={submit}>+ {t`Create`}</ButtonDefault>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                )}
            </Mutation>
        </Dialog>
    );
};

export default compose(
    withSnackbar(),
    withRouter
)(NewFormDialog);
