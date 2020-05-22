import React, { useState } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useApolloClient } from "react-apollo";
import { DELETE_PAT, UPDATE_PAT } from "@webiny/app-security/admin/views/AccountGraphql";
import {
    Dialog,
    DialogAccept,
    DialogActions,
    DialogCancel,
    DialogContent,
    DialogTitle
} from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import { ListItemMeta, SimpleListItem } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as EditIcon } from "@webiny/app-security/admin/assets/icons/edit-24px.svg";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "@webiny/app-security/admin/assets/icons/delete-24px.svg";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-security/admin/roles/data-list");

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
            <Dialog
                open={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                data-testid="update-personal-account-token-dialog"
            >
                <DialogTitle>{t`Update Token`}</DialogTitle>
                <DialogContent>
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
                data-testid="pat-tokens-list-item"
                key={PAT.id}
                text={<div style={{ paddingLeft: "16px" }}>{PAT.name}</div>}
            >
                <ListItemMeta>
                    <IconButton
                        data-testid="update-personal-access-token"
                        onClick={() => setShowEditDialog(true)}
                        icon={<EditIcon />}
                    />
                    <ConfirmationDialog
                        data-testid="delete-personal-access-token-dialog"
                        title={t`Delete Token`}
                        message={t`Are you sure you want to delete this token?`}
                    >
                        {({ showConfirmation }) => {
                            return (
                                <IconButton
                                    data-testid={`delete-personal-access-token`}
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

export default TokenListItem;
