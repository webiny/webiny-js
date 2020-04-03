import { ListItemMeta, SimpleListItem } from "@webiny/ui/List";
import { ButtonDefault, IconButton } from "@webiny/ui/Button";
import { ReactComponent as CopyToClipboardIcon } from "@webiny/app-security/admin/assets/icons/file_copy-24px.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-security/admin/assets/icons/delete-24px.svg";
import { ReactComponent as EditIcon } from "@webiny/app-security/admin/assets/icons/edit-24px.svg";
import React, { useState } from "react";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { Input } from "@webiny/ui/Input";
import { Cell, Grid } from "@webiny/ui/Grid";
import { useApolloClient } from "react-apollo";
import gql from "graphql-tag";

const GET_NEW_PAT = gql`
    mutation {
        security {
            createPAT
        }
    }
`;

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15,
});

const TokenListItem = ({ PAT, data, setValue }) => {
    const [isEditing, setIsEditing] = useState(false);

    const deleteToken = () => {
        const newPATs = data.personalAccessTokens.filter((crtPAT) => crtPAT.token != PAT.token);
        setValue("personalAccessTokens", newPATs);
    };

    const changeTokenName = (newName) => {
        const newPATs = data.personalAccessTokens.map((crtPAT) =>
            crtPAT !== PAT
                ? crtPAT
                : {
                      ...crtPAT,
                      name: newName,
                  }
        );
        setValue("personalAccessTokens", newPATs);
    };

    return (
        <SimpleListItem
            data-testid={`pat-token-list-item-${PAT.token}`}
            key={PAT.token}
            text={
                !isEditing ? (
                    <div style={{ paddingLeft: "16px" }}>{PAT.name}</div>
                ) : (
                    <Grid style={{ width: "70%", marginLeft: 0, paddingLeft: 0 }}>
                        <Cell span={12}>
                            <Input
                                value={PAT.name}
                                onChange={(newName) => changeTokenName(newName)}
                            />
                        </Cell>
                    </Grid>
                )
            }
        >
            <ListItemMeta>
                <IconButton
                    data-testid={`editToken`}
                    onClick={() => setIsEditing(!isEditing)}
                    icon={<EditIcon />}
                />
                <IconButton
                    onClick={() => navigator.clipboard.writeText(PAT.token)}
                    icon={<CopyToClipboardIcon />}
                />
                <IconButton
                    data-testid={`deleteToken`}
                    onClick={() => deleteToken()}
                    icon={<DeleteIcon />}
                />
            </ListItemMeta>
        </SimpleListItem>
    );
};

const TokenList = ({ data, setValue }) => {
    if (data.personalAccessTokens && data.personalAccessTokens.length > 0)
        return data.personalAccessTokens.map((PAT) => (
            <TokenListItem key={PAT.token} PAT={PAT} data={data} setValue={setValue} />
        ));
    else return <SimpleListItem text="No tokens have been generated yet." />;
};

const TokensElement = ({ setFormIsLoading, data, setValue }) => {
    const client = useApolloClient();

    const generateToken = async () => {
        setFormIsLoading(true);

        const queryResponse = await client.mutate({
            mutation: GET_NEW_PAT,
        });
        const personalAccessToken = {
            token: queryResponse.data.security.createPAT,
            name: "New token",
        };

        let newPATs;
        if (!data.personalAccessTokens) newPATs = [personalAccessToken];
        else newPATs = [...data.personalAccessTokens, personalAccessToken];

        setFormIsLoading(false);
        setValue("personalAccessTokens", newPATs);
    };

    return (
        <>
            <Header>
                <Typography style={{ lineHeight: "2.4rem" }} use={"overline"}>
                    Tokens
                </Typography>
                <ButtonDefault onClick={generateToken}>Create Token</ButtonDefault>
            </Header>
            <TokenList data={data} setValue={setValue} />
        </>
    );
};

export default TokensElement;
