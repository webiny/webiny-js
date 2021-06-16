import React, { useState, useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { set } from "dot-prop-immutable";
import { ButtonDefault, IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { ListItemMeta, SimpleListItem } from "@webiny/ui/List";
import { ReactComponent as EditIcon } from "../../assets/icons/edit-24px.svg";
import { UpdateTokenDialog } from "./UpdateTokenDialog";
import { ReactComponent as DeleteIcon } from "../../assets/icons/delete-24px.svg";
import { DELETE_PAT, GET_CURRENT_USER } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CreateTokenDialog } from "./CreateTokenDialog";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

const t = i18n.ns("app-security/admin/personal-access-tokens");

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15
});

const TokensElement = ({ tokens }) => {
    const [createToken, setCreateToken] = useState(false);
    const [updateToken, setUpdateToken] = useState(false);
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete token confirmation`,
        message: t`Are you sure you want to delete this token?`
    });

    const onClose = useCallback(() => {
        setCreateToken(false);
    }, []);

    const deleteToken = async token => {
        showConfirmation(async () => {
            const queryResponse = await client.mutate({
                mutation: DELETE_PAT,
                variables: {
                    id: token.id
                },
                update(cache) {
                    const data: any = cache.readQuery({ query: GET_CURRENT_USER });
                    const tokens = data.security.user.data.personalAccessTokens.filter(item => {
                        return item.id !== token.id;
                    });

                    cache.writeQuery({
                        query: GET_CURRENT_USER,
                        data: set(data, `security.user.data.personalAccessTokens`, tokens)
                    });
                }
            });

            const { error } = queryResponse.data.security.deletePAT;
            if (error) {
                return showSnackbar(error.message, {
                    action: t`Close`
                });
            }

            showSnackbar(t`Token deleted successfully!`);
        });
    };

    return (
        <>
            <Header>
                <Typography style={{ lineHeight: "2.4rem" }} use={"overline"}>
                    {t`Tokens`}
                </Typography>
                <ButtonDefault onClick={() => setCreateToken(true)}>
                    {t`Create Token`}
                </ButtonDefault>
            </Header>
            <div data-testid={"pat-tokens-list"}>
                <CreateTokenDialog open={createToken} onClose={onClose} />
                <UpdateTokenDialog
                    open={Boolean(updateToken)}
                    token={updateToken}
                    onClose={() => setUpdateToken(false)}
                />
                {Array.isArray(tokens)
                    ? tokens.map(token => (
                          <SimpleListItem
                              data-testid="pat-tokens-list-item"
                              key={token.id}
                              text={
                                  <div style={{ paddingLeft: "16px" }}>
                                      {token.name} (********{token.token})
                                  </div>
                              }
                          >
                              <ListItemMeta>
                                  <IconButton
                                      data-testid="update-personal-access-token"
                                      onClick={() => setUpdateToken(token)}
                                      icon={<EditIcon />}
                                  />
                                  <IconButton
                                      data-testid={`delete-personal-access-token`}
                                      onClick={() => deleteToken(token)}
                                      icon={<DeleteIcon />}
                                  />
                              </ListItemMeta>
                          </SimpleListItem>
                      ))
                    : null}

                {!Array.isArray(tokens) || tokens.length === 0 ? (
                    <SimpleListItem text={t`You don't have any tokens yet.`} />
                ) : null}
            </div>
        </>
    );
};

export default TokensElement;
