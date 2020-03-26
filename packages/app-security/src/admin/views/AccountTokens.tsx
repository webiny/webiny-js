import { ListItemMeta, SimpleListItem } from "@webiny/ui/List";
import { ButtonDefault, IconButton } from "@webiny/ui/Button";
import { ReactComponent as CopyToClipboardIcon } from "@webiny/app-security/admin/assets/icons/file_copy-24px.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-security/admin/assets/icons/delete-24px.svg";
import React from "react";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15
});

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
    console.log("PATs");
    console.log(personalAccessTokens);

    return (
        <>
            <Header>
                <Typography style={{ lineHeight: "2.4rem" }} use={"overline"}>
                    Tokens
                </Typography>
                <ButtonDefault onClick={generateToken}>Create Token</ButtonDefault>
            </Header>
            <TokenList deleteToken={deleteToken} personalAccessTokens={personalAccessTokens} />
        </>
    );
};

export default TokensElement;
