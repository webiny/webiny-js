// @flow
import React from "react";
import { css } from "emotion";
import useReactRouter from "use-react-router";
import { Mutation } from "react-apollo";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { CREATE_FORM } from "@webiny/app-forms/admin/viewsGraphql";
import get from "lodash.get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("Forms.NewFormDialog");

import { Dialog, DialogTitle, DialogContent, DialogActions } from "@webiny/ui/Dialog";
import { ButtonDefault } from "@webiny/ui/Button";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

const NewFormDialog = ({ open, onClose }: { open: boolean, onClose: Function }) => {
    // $FlowFixMe
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();

    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Mutation mutation={CREATE_FORM}>
                {update => (
                    <Form
                        onSubmit={async data => {
                            setLoading(true);
                            const response = get(
                                await update({
                                    variables: data,
                                    refetchQueries: ["FormsListForms"]
                                }),
                                "data.forms.form"
                            );
                            setLoading(false);

                            if (response.error) {
                                return showSnackbar(response.error.message);
                            }

                            history.push("/forms/" + response.data.id);
                        }}
                    >
                        {({ Bind, submit }) => (
                            <>
                                {loading && <CircularProgress />}
                                <DialogTitle>{t`New form`}</DialogTitle>
                                <DialogContent>
                                    <Bind name={"name"}>
                                        <Input placeholder={"Enter a name for your new form"} />
                                    </Bind>
                                </DialogContent>
                                <DialogActions>
                                    <ButtonDefault onClick={submit}>+ {t`Create`}</ButtonDefault>
                                </DialogActions>
                            </>
                        )}
                    </Form>
                )}
            </Mutation>
        </Dialog>
    );
};

export default NewFormDialog;
