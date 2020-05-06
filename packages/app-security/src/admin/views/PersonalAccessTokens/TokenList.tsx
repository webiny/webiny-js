import React, { useReducer } from "react";
import { SimpleListItem } from "@webiny/ui/List";
import {
    Dialog,
    DialogAccept,
    DialogActions,
    DialogCancel,
    DialogContent,
    DialogTitle
} from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import TokenListItem from "./TokenListItem";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-security/admin/roles/data-list");

const TokenList = ({ setFormIsLoading, data, setValue }) => {
    const [{ showEditDialog, updateToken, newTokenName }, setState] = useReducer(
        (prev, next) => ({ ...prev, ...next }),
        {
            showEditDialog: false
        }
    );

    const setShowEditDialog = value => setState({ showEditDialog: value });
    const setUpdateToken = value => setState({ updateToken: value });
    const setNewTokenName = value => setState({ newTokenName: value });

    let Tokens;
    if (data.personalAccessTokens && data.personalAccessTokens.length > 0) {
        Tokens = data.personalAccessTokens.map(PAT => (
            <TokenListItem
                setShowEditDialog={setShowEditDialog}
                setUpdateToken={setUpdateToken}
                setFormIsLoading={setFormIsLoading}
                setNewTokenName={setNewTokenName}
                key={PAT.id}
                PAT={PAT}
                data={data}
                setValue={setValue}
            />
        ));
    } else {
        Tokens = <SimpleListItem text={t`No tokens have been generated yet.`} />;
    }

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
                        value={newTokenName}
                        onChange={newName => {
                            newName = newName.slice(0, 100);
                            // setTokenName(newName);
                            setState({ newTokenName: newName });
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <DialogCancel>Cancel</DialogCancel>
                    <DialogAccept
                        onClick={() => updateToken({ name: newTokenName })}
                    >{t`OK`}</DialogAccept>
                </DialogActions>
            </Dialog>

            {Tokens}
        </>
    );
};

export default TokenList;
