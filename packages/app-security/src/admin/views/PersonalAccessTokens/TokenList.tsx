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
    const [{ activeTokenName, showEditDialog, updateToken, setTokenName }, setState] = useReducer(
        (prev, next) => ({ ...prev, ...next }),
        {
            activeTokenName: null,
            showEditDialog: false,
            updateToken: null,
            setTokenName: null
        }
    );

    const setShowEditDialog = value => setState({ showEditDialog: value });
    const setUpdateToken = value => setState({ updateToken: value });
    const setSetTokenName = value => setState({ setTokenName: value });

    let Tokens;
    if (data.personalAccessTokens && data.personalAccessTokens.length > 0) {
        Tokens = data.personalAccessTokens.map(PAT => (
            <TokenListItem
                setShowEditDialog={setShowEditDialog}
                setUpdateToken={setUpdateToken}
                setSetTokenName={setSetTokenName}
                setFormIsLoading={setFormIsLoading}
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
                        value={activeTokenName}
                        onChange={newName => setTokenName(newName.slice(0, 100))}
                    />
                </DialogContent>
                <DialogActions>
                    <DialogCancel>Cancel</DialogCancel>
                    <DialogAccept onClick={() => updateToken()}>{t`OK`}</DialogAccept>
                </DialogActions>
            </Dialog>

            {Tokens}
        </>
    );
};

export default TokenList;
