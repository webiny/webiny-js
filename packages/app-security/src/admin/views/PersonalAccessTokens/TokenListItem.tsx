import React, { useState } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useApolloClient } from "react-apollo";
import { DELETE_PAT, UPDATE_PAT } from "@webiny/app-security/admin/views/AccountGraphql";
import { ListItemMeta, SimpleListItem } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as EditIcon } from "@webiny/app-security/admin/assets/icons/edit-24px.svg";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "@webiny/app-security/admin/assets/icons/delete-24px.svg";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-security/admin/roles/data-list");

const TokenListItem = ({
    setFormIsLoading,
    data,
    setValue,
    PAT,
    setShowEditDialog,
    setUpdateToken,
    setNewTokenName
}) => {
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

    const updateToken = async ({ name }) => {
        setTokenName(name);

        setFormIsLoading(true);
        const queryResponse = await client.mutate({
            mutation: UPDATE_PAT,
            variables: {
                id: PAT.id,
                data: {
                    name
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
                      name
                  }
        );

        setValue("personalAccessTokens", newPATs);
        showSnackbar(t`Token updated successfully!`);
    };

    return (
        <>
            <SimpleListItem
                data-testid="pat-tokens-list-item"
                key={PAT.id}
                text={<div style={{ paddingLeft: "16px" }}>{PAT.name}</div>}
            >
                <ListItemMeta>
                    <IconButton
                        data-testid="update-personal-access-token"
                        onClick={() => {
                            setShowEditDialog(true);
                            setUpdateToken(updateToken);
                            setNewTokenName(tokenName);
                        }}
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
