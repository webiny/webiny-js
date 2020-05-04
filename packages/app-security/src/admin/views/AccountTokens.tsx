import { useApolloClient } from "react-apollo";
import { ListItemMeta, SimpleListItem } from "@webiny/ui/List";
import { ButtonDefault, IconButton } from "@webiny/ui/Button";
import { ReactComponent as DeleteIcon } from "@webiny/app-security/admin/assets/icons/delete-24px.svg";
import { ReactComponent as EditIcon } from "@webiny/app-security/admin/assets/icons/edit-24px.svg";
import { ReactComponent as CopyToClipboardIcon } from "@webiny/app-security/admin/assets/icons/file_copy-24px.svg";
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
    DialogActions
} from "@webiny/ui/Dialog";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Alert } from "@webiny/ui/Alert";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-security/admin/roles/data-list");

import { CREATE_PAT, UPDATE_PAT, DELETE_PAT } from "./AccountGraphql";

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

const TokenListItem = ({ setFormIsLoading, data, setValue, PAT }) => {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [tokenName, setTokenName] = useState(PAT.name);
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const deleteToken = async () => {
        setFormIsLoading(true);
        const queryResponse = await client.mutate({
            mutation: DELETE_PAT,
            variables: {
                id: PAT.id
            }
        });
        setFormIsLoading(false);

        const { error } = queryResponse.data.security.deletePAT;
        if (error) {
            return showSnackbar(error.message, {
                action: t`Close`
            });
        }

        const newPATs = data.personalAccessTokens.filter(crtPAT => crtPAT.id != PAT.id);

        setValue("personalAccessTokens", newPATs);
        showSnackbar(t`Token deleted successfully!`);
    };

    const updateToken = async () => {
        setFormIsLoading(true);
        const queryResponse = await client.mutate({
            mutation: UPDATE_PAT,
            variables: {
                id: PAT.id,
                data: {
                    name: tokenName
                }
            }
        });
        setFormIsLoading(false);

        const { error } = queryResponse.data.security.updatePAT;
        if (error) {
            return showSnackbar(error.message, {
                action: t`Close`
            });
        }

        const newPATs = data.personalAccessTokens.map(crtPAT =>
            crtPAT !== PAT
                ? crtPAT
                : {
                      ...crtPAT,
                      name: tokenName
                  }
        );

        setValue("personalAccessTokens", newPATs);
        showSnackbar(t`Token updated successfully!`);
    };

    return (
        <>
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
                <DialogTitle>Update Token</DialogTitle>
                <DialogContent data-testid={`UpdateTokenDialogContent-${PAT.id}`}>
                    <Input
                        label={t`Token name`}
                        value={tokenName}
                        onChange={newName => setTokenName(newName.slice(0, 100))}
                    />
                </DialogContent>
                <DialogActions>
                    <DialogCancel>Cancel</DialogCancel>
                    <DialogAccept
                        data-testid={`AcceptUpdateToken-${PAT.id}`}
                        onClick={() => updateToken()}
                    >
                        {t`OK`}
                    </DialogAccept>
                </DialogActions>
            </Dialog>

            <SimpleListItem
                data-testid={`pat-token-list-item-${PAT.id}`}
                key={PAT.id}
                text={<div style={{ paddingLeft: "16px" }}>{PAT.name}</div>}
            >
                <ListItemMeta>
                    <IconButton
                        data-testid={`updateToken-${PAT.id}`}
                        onClick={() => setShowEditDialog(true)}
                        icon={<EditIcon />}
                    />
                    <ConfirmationDialog
                        data-testid={`DeleteTokenDialog-${PAT.id}`}
                        title="Delete Token"
                        message={t`Are you sure you want to delete this token?`}
                    >
                        {({ showConfirmation }) => {
                            return (
                                <IconButton
                                    data-testid={`deleteToken-${PAT.id}`}
                                    onClick={() => showConfirmation(() => deleteToken())}
                                    icon={<DeleteIcon />}
                                />
                            );
                        }}
                    </ConfirmationDialog>
                </ListItemMeta>
            </SimpleListItem>
        </>
    );
};

const TokenList = ({ setFormIsLoading, data, setValue }) => {
    if (data.personalAccessTokens && data.personalAccessTokens.length > 0) {
        return data.personalAccessTokens.map(PAT => (
            <TokenListItem
                setFormIsLoading={setFormIsLoading}
                key={PAT.id}
                PAT={PAT}
                data={data}
                setValue={setValue}
            />
        ));
    }

    return <SimpleListItem text={t`No tokens have been generated yet.`} />;
};

const TokensElement = ({ setFormIsLoading, data, setValue }) => {
    const [showCreatePATDialog, setShowCreatePATDialog] = useState(false);
    const [showPATHashDialog, setShowPATHashDialog] = useState(false);
    const [tokenHash, setTokenHash] = useState("HSDIGHSDGIASDHISDHIAGDSHGIDSHIGSHAIGHI"); // TODO: @Andrei why random string here?
    const [newPATName, setNewPATName] = useState("New token");
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const generateToken = async () => {
        setFormIsLoading(true);
        const queryResponse = await client.mutate({
            mutation: CREATE_PAT,
            variables: {
                name: newPATName,
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
        } else newPATs = [...data.personalAccessTokens, personalAccessToken];

        setValue("personalAccessTokens", newPATs);
        setTokenHash(token);
        setNewPATName("New token");
        setShowPATHashDialog(true);
        showSnackbar(t`Token created successfully!`);
    };

    return (
        <>
            <Dialog open={showCreatePATDialog} onClose={() => setShowCreatePATDialog(false)}>
                <DialogTitle>Create new Personal Access Token</DialogTitle>
                <DialogContent data-testid={`create-token-dialog-content`}>
                    <Input
                        label={t`Token name`}
                        value={newPATName}
                        onChange={newName => setNewPATName(newName.slice(0, 100))}
                    />
                </DialogContent>
                <DialogActions>
                    <DialogCancel>{t`Cancel`}</DialogCancel>
                    <DialogAccept
                        data-testid={`accept-generate-token`}
                        onClick={() => generateToken()}
                    >
                        {t`OK`}
                    </DialogAccept>
                </DialogActions>
            </Dialog>

            <Dialog open={showPATHashDialog} onClose={() => setShowPATHashDialog(false)}>
                <DialogTitle>Your Personal Access Token</DialogTitle>
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
                            <>
                                <IconButton
                                    onClick={() => navigator.clipboard.writeText(tokenHash)}
                                    icon={<CopyToClipboardIcon />}
                                />
                            </>
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
            <TokenList setFormIsLoading={setFormIsLoading} data={data} setValue={setValue} />
        </>
    );
};

export default TokensElement;
