import { CollapsibleList, ListItemMeta, SimpleListItem } from "@webiny/ui/List";
import { ButtonPrimary, IconButton } from "@webiny/ui/Button";
import { ReactComponent as CopyToClipboardIcon } from "@webiny/app-security/admin/assets/icons/file_copy-24px.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-security/admin/assets/icons/delete-24px.svg";
import React, { useState } from "react";

const TokenListItem = ({ deleteToken, token }) => (
    <SimpleListItem key={token} text={token}>
        <ListItemMeta>
            <IconButton
                onClick={() => navigator.clipboard.writeText(token)}
                icon={<CopyToClipboardIcon />}
            />
            <IconButton onClick={() => deleteToken(token)} icon={<DeleteIcon />} />
        </ListItemMeta>
    </SimpleListItem>
);

const TokenList = ({ deleteToken, personalAccessTokens }) => {
    if (personalAccessTokens && personalAccessTokens.length > 0)
        return personalAccessTokens.map(PAT => TokenListItem({ deleteToken, token: PAT.token }));
    else return <SimpleListItem text="No tokens have been generated yet." />;
};

const TokensElement = ({ deleteToken, generateToken, personalAccessTokens }) => {
    const [tokensListIsOpen, setTokensListIsOpen] = useState(false);
    return (
        <>
            <CollapsibleList
                open={tokensListIsOpen}
                handle={
                    <SimpleListItem
                        onClick={() => setTokensListIsOpen(!tokensListIsOpen)}
                        text={`Tokens`}
                    />
                }
            >
                <TokenList deleteToken={deleteToken} personalAccessTokens={personalAccessTokens} />
            </CollapsibleList>
            <ButtonPrimary onClick={() => generateToken()}>Generate</ButtonPrimary>
        </>
    );
};

export default TokensElement;
