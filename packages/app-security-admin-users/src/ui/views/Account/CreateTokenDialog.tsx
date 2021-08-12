import React, { useState, useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { set } from "dot-prop-immutable";
import styled from "@emotion/styled";
import {
    Dialog,
    DialogActions,
    DialogButton,
    DialogCancel,
    DialogContent,
    DialogTitle
} from "@webiny/ui/Dialog";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { Form } from "@webiny/form";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import { Alert } from "@webiny/ui/Alert";
import { Typography } from "@webiny/ui/Typography";
import { CopyButton } from "@webiny/ui/Button";
import { CREATE_PAT, GET_CURRENT_USER } from "./graphql";

const t = i18n.ns("app-security-admin-users/pats/create-token-dialog");

const PatContainer = styled("div")({
    paddingLeft: "12px",
    paddingRight: "12px",
    background: "var(--mdc-theme-on-background)"
});

export const CreateTokenDialog = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [newToken, setNewToken] = useState(null);
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const resetAndClose = useCallback(() => {
        onClose();
        setTimeout(() => {
            setNewToken(null);
        }, 1000);
    }, []);

    const onSubmit = async formData => {
        setLoading(true);
        const queryResponse = await client.mutate({
            mutation: CREATE_PAT,
            variables: {
                data: formData
            },
            update(cache, { data: { security } }) {
                const data: any = cache.readQuery({ query: GET_CURRENT_USER });

                cache.writeQuery({
                    query: GET_CURRENT_USER,
                    data: set(data, `security.user.data.personalAccessTokens`, tokens => [
                        ...tokens,
                        security.createPAT.data.pat
                    ])
                });
            }
        });
        setLoading(false);

        const { data, error } = queryResponse.data.security.createPAT;
        if (error) {
            return showSnackbar(error.message, {
                action: t`Close`
            });
        }

        setNewToken(data.token);
    };

    const renderTokenCreated = () => {
        return (
            <>
                <DialogTitle>{t`Your Personal Access Token`}</DialogTitle>
                <DialogContent>
                    <Alert title={t`Copy your token`} type="info">
                        {t`Make sure you copy your new personal access token. You won't be able to see it again!`}
                    </Alert>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <PatContainer>
                            <Typography use="overline">{newToken}</Typography>
                        </PatContainer>
                        <CopyButton value={newToken} />
                    </div>
                </DialogContent>
                <DialogActions>
                    <DialogButton data-testid={`accept-generate-token`} onClick={resetAndClose}>
                        {t`I have copied the token!`}
                    </DialogButton>
                </DialogActions>
            </>
        );
    };

    const renderCreateToken = (Bind, form) => {
        return (
            <>
                {loading && <CircularProgress label={"Creating token..."} />}
                <DialogTitle>{t`Create a Personal Access Token`}</DialogTitle>
                <DialogContent>
                    <Bind name={"name"} validators={validation.create("required,maxLength:100")}>
                        <Input label={t`Token name`} />
                    </Bind>
                </DialogContent>
                <DialogActions>
                    <DialogCancel>{t`Cancel`}</DialogCancel>
                    <DialogButton data-testid={`accept-generate-token`} onClick={form.submit}>
                        {t`OK`}
                    </DialogButton>
                </DialogActions>
            </>
        );
    };

    return (
        <Dialog
            open={open}
            data-testid="account-tokens-dialog"
            preventOutsideDismiss
            onClose={resetAndClose}
        >
            <Form onSubmit={onSubmit} submitOnEnter={true}>
                {({ Bind, form }) =>
                    newToken ? renderTokenCreated() : renderCreateToken(Bind, form)
                }
            </Form>
        </Dialog>
    );
};
