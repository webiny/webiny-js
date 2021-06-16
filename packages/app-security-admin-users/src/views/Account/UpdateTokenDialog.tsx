import React, { useState } from "react";
import {
    Dialog,
    DialogButton,
    DialogActions,
    DialogCancel,
    DialogContent,
    DialogTitle
} from "@webiny/ui/Dialog";
import { UPDATE_PAT } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useApolloClient } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { Input } from "@webiny/ui/Input";
import { Form } from "@webiny/form";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-security/admin/roles/data-list");

export const UpdateTokenDialog = ({ open, onClose, token }) => {
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const onSubmit = async data => {
        setLoading(true);
        const queryResponse = await client.mutate({
            mutation: UPDATE_PAT,
            variables: {
                id: token.id,
                data: { name: data.name }
            }
        });
        setLoading(false);

        const { error } = queryResponse.data.security.updatePAT;
        if (error) {
            return showSnackbar(error.message, {
                action: t`Close`
            });
        }

        showSnackbar(t`Token updated successfully!`);
        onClose();
    };

    if (!open) {
        return null;
    }

    return (
        <Dialog open={open} onClose={onClose} data-testid="update-personal-account-token-dialog">
            <Form data={token} onSubmit={onSubmit}>
                {({ Bind, form }) => (
                    <>
                        {loading && <CircularProgress label={"Updating token..."} />}
                        <DialogTitle>{t`Update Token`}</DialogTitle>
                        <DialogContent>
                            <Bind name={"name"}>
                                <Input label={t`Token name`} />
                            </Bind>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogButton
                                data-testid={`AcceptUpdateToken-${token.id}`}
                                onClick={form.submit}
                            >
                                {t`OK`}
                            </DialogButton>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};
