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
import gql from "graphql-tag";
import {
    Dialog,
    DialogCancel,
    DialogAccept,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@webiny/ui/Dialog";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Alert } from "@webiny/ui/Alert";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

const CREATE_NEW_PAT = gql`
    mutation createPat($name: String!, $userId: ID) {
        security {
            createPAT(name: $name, userId: $userId) {
                data {
                    pat {
                        id
                        name
                        token
                    }
                    token
                }
                error {
                    message
                }
            }
        }
    }
`;

const UPDATE_PAT = gql`
    mutation($id: ID!, $data: PersonalAccessTokenInput!) {
        security {
            updatePAT(id: $id, data: $data) {
                data {
                    id
                    name
                    token
                }
                error {
                    message
                }
            }
        }
    }
`;

const DELETE_PAT = gql`
    mutation deletePat($id: ID!) {
        security {
            deletePAT(id: $id) {
                data
                error {
                    message
                }
            }
        }
    }
`;

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15,
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
                id: PAT.id,
            },
        });
        setFormIsLoading(false);

        const { error } = queryResponse.data.security.deletePAT;
        if (error) {
            return showSnackbar(error.message, {
                action: "Close",
            });
        }

        const newPATs = data.personalAccessTokens.filter((crtPAT) => crtPAT.id != PAT.id);

        setValue("personalAccessTokens", newPATs);
        showSnackbar("Token deleted succesfully!");
    };

    const updateToken = async () => {
        setFormIsLoading(true);
        const queryResponse = await client.mutate({
            mutation: UPDATE_PAT,
            variables: {
                id: PAT.id,
                data: {
                    name: tokenName,
                },
            },
        });
        setFormIsLoading(false);

        const { error } = queryResponse.data.security.updatePAT;
        if (error) {
            return showSnackbar(error.message, {
                action: "Close",
            });
        }

        const newPATs = data.personalAccessTokens.map((crtPAT) =>
            crtPAT !== PAT
                ? crtPAT
                : {
                      ...crtPAT,
                      name: tokenName,
                  }
        );

        setValue("personalAccessTokens", newPATs);
        showSnackbar("Token updated succesfully!");
    };

    return (
        <>
            <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
                <DialogTitle>Update Token</DialogTitle>
                <DialogContent>
                    <Input
                        label="Token name"
                        value={tokenName}
                        onChange={(newName) => setTokenName(newName.slice(0, 100))}
                    />
                </DialogContent>
                <DialogActions>
                    <DialogCancel>Cancel</DialogCancel>
                    <DialogAccept onClick={() => updateToken()}>OK</DialogAccept>
                </DialogActions>
            </Dialog>

            <SimpleListItem
                data-testid={`pat-token-list-item-${PAT.id}`}
                key={PAT.id}
                text={<div style={{ paddingLeft: "16px" }}>{PAT.name}</div>}
            >
                <ListItemMeta>
                    <IconButton
                        data-testid={`editToken`}
                        onClick={() => setShowEditDialog(true)}
                        icon={<EditIcon />}
                    />
                    <ConfirmationDialog
                        title="Delete Token"
                        message="Are you sure you want to delete this token?"
                    >
                        {({ showConfirmation }) => {
                            return (
                                <IconButton
                                    data-testid={`deleteToken`}
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
    if (data.personalAccessTokens && data.personalAccessTokens.length > 0)
        return data.personalAccessTokens.map((PAT) => (
            <TokenListItem
                setFormIsLoading={setFormIsLoading}
                key={PAT.id}
                PAT={PAT}
                data={data}
                setValue={setValue}
            />
        ));
    else return <SimpleListItem text="No tokens have been generated yet." />;
};

const TokensElement = ({ setFormIsLoading, data, setValue }) => {
    const [showCreatePATDialog, setShowCreatePATDialog] = useState(false);
    const [showPATHashDialog, setShowPATHashDialog] = useState(false);
    const [tokenHash, setTokenHash] = useState("HSDIGHSDGIASDHISDHIAGDSHGIDSHIGSHAIGHI");
    const [newPATName, setNewPATName] = useState("New token");
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const generateToken = async () => {
        setFormIsLoading(true);
        const queryResponse = await client.mutate({
            mutation: CREATE_NEW_PAT,
            variables: {
                name: newPATName,
                userId: data.id,
            },
        });
        setFormIsLoading(false);

        const { error } = queryResponse.data.security.createPAT;
        if (error) {
            return showSnackbar(error.message, {
                action: "Close",
            });
        }

        const { token, pat: personalAccessToken } = queryResponse.data.security.createPAT.data;
        let newPATs;
        if (!data.personalAccessTokens) newPATs = [personalAccessToken];
        else newPATs = [...data.personalAccessTokens, personalAccessToken];

        setValue("personalAccessTokens", newPATs);
        setTokenHash(token);
        setNewPATName("New token");
        setShowPATHashDialog(true);
        showSnackbar("Token created succesfully!");
    };

    return (
        <>
            <Dialog open={showCreatePATDialog} onClose={() => setShowCreatePATDialog(false)}>
                <DialogTitle>Create new Personal Access Token</DialogTitle>
                <DialogContent>
                    <Input
                        label="Token name"
                        value={newPATName}
                        onChange={(newName) => setNewPATName(newName.slice(0, 100))}
                    />
                </DialogContent>
                <DialogActions>
                    <DialogCancel>Cancel</DialogCancel>
                    <DialogAccept onClick={() => generateToken()}>OK</DialogAccept>
                </DialogActions>
            </Dialog>

            <Dialog open={showPATHashDialog} onClose={() => setShowPATHashDialog(false)}>
                <DialogTitle>Your Personal Access Token</DialogTitle>
                <DialogContent>
                    <Alert title="Please copy the token" type="info">
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        Make sure to copy your new personal access token now. You won't be able to
                        see it again!
                    </Alert>
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <Typography
                                use="overline"
                                style={{
                                    paddingLeft: "12px",
                                    paddingRight: "12px",
                                    background: "#DDD",
                                }}
                            >
                                {tokenHash}
                            </Typography>
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
                    <DialogAccept>Close</DialogAccept>
                </DialogActions>
            </Dialog>

            <Header>
                <Typography style={{ lineHeight: "2.4rem" }} use={"overline"}>
                    Tokens
                </Typography>
                <ButtonDefault onClick={() => setShowCreatePATDialog(true)}>
                    Create Token
                </ButtonDefault>
            </Header>
            <TokenList setFormIsLoading={setFormIsLoading} data={data} setValue={setValue} />
        </>
    );
};

export default TokensElement;
