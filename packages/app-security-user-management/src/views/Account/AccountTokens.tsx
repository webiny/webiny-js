import { useApolloClient } from "react-apollo";
import { ButtonDefault, CopyButton } from "@webiny/ui/Button";
import { Form } from "@webiny/form";
import React, { useState } from "react";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { Input } from "@webiny/ui/Input";
import {
    Dialog,
    DialogCancel,
    DialogAccept,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogButton
} from "@webiny/ui/Dialog";
import { Alert } from "@webiny/ui/Alert";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-security/admin/roles/data-list");
import TokenList from "../PersonalAccessTokens/TokenList";

import { CREATE_PAT } from "./graphql";
import { validation } from "@webiny/validation";

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15
});

const PatContainer = styled("div")({
    paddingLeft: "12px",
    paddingRight: "12px",
    background: "var(--mdc-theme-on-background)"
});

const TokensElement = ({ setFormIsLoading, data, setValue }) => {
    const [showCreatePATDialog, setShowCreatePATDialog] = useState(false);
    const [showPATHashDialog, setShowPATHashDialog] = useState(false);
    const [tokenHash, setTokenHash] = useState();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const generateToken = async formData => {
        setShowCreatePATDialog(false);
        setFormIsLoading(true);
        const queryResponse = await client.mutate({
            mutation: CREATE_PAT,
            variables: {
                name: formData.createTokenName,
                userId: data.id
            }
        });
        setFormIsLoading(false);

        const { error } = queryResponse.data.security.createPAT;
        if (error) {
            return showSnackbar(error.message, {
                action: t`Close`
            });
        }

        const { token, pat: personalAccessToken } = queryResponse.data.security.createPAT.data;
        let newPATs;
        if (!data.personalAccessTokens) {
            newPATs = [personalAccessToken];
        } else {
            newPATs = [personalAccessToken, ...data.personalAccessTokens];
        }

        setValue("personalAccessTokens", newPATs);
        setTokenHash(token);
        setShowPATHashDialog(true);
        showSnackbar(t`Token created successfully!`);
    };

    return (
        <>
            <Form onSubmit={generateToken} submitOnEnter={true}>
                {({ Bind, form }) => (
                    <Dialog
                        open={showCreatePATDialog}
                        onClose={() => setShowCreatePATDialog(false)}
                        data-testid="account-tokens-dialog"
                    >
                        <DialogTitle>{t`Create new Personal Access Token`}</DialogTitle>
                        <DialogContent>
                            <Bind
                                name={"createTokenName"}
                                validators={validation.create("required,maxLength:100")}
                            >
                                <Input label={t`Token name`} />
                            </Bind>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel>{t`Cancel`}</DialogCancel>
                            <DialogButton
                                data-testid={`accept-generate-token`}
                                onClick={form.submit}
                            >
                                {t`OK`}
                            </DialogButton>
                        </DialogActions>
                    </Dialog>
                )}
            </Form>

            <Dialog
                open={showPATHashDialog}
                onClose={() => setShowPATHashDialog(false)}
                data-testid="created-token-dialog"
            >
                <DialogTitle>{t`Your Personal Access Token`}</DialogTitle>
                <DialogContent>
                    <Alert title={t`Please copy the token`} type="info">
                        {t`Make sure to copy your new personal access token now. You won't be able to see it again!`}
                    </Alert>
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <PatContainer>
                                <Typography use="overline">{tokenHash}</Typography>
                            </PatContainer>
                            <CopyButton value={tokenHash} />
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <DialogAccept>{t`Close`}</DialogAccept>
                </DialogActions>
            </Dialog>

            <Header>
                <Typography style={{ lineHeight: "2.4rem" }} use={"overline"}>
                    {t`Tokens`}
                </Typography>
                <ButtonDefault onClick={() => setShowCreatePATDialog(true)}>
                    {t`Create Token`}
                </ButtonDefault>
            </Header>
            <div data-testid={"pat-tokens-list"}>
                <TokenList setFormIsLoading={setFormIsLoading} data={data} setValue={setValue} />
            </div>
        </>
    );
};

export default TokensElement;
