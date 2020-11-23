import React from "react";
import { SimpleListItem } from "@webiny/ui/List";
import TokenListItem from "./TokenListItem";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-security/admin/roles/data-list");

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

export default TokenList;
