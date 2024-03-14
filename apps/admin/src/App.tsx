import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import "./App.scss";

import { ContentEntryListConfig } from "@webiny/app-headless-cms";

const { Browser } = ContentEntryListConfig;

const ArticleAuditStatusCell = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row) || !row?.articleAudit?.status) {
        return <>{"-"}</>;
    }

    return <>{row.articleAudit.status}</>;
};

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <ContentEntryListConfig>
                <Browser.Table.Column
                    name={"articleAuditStatus"}
                    modelIds={["article"]}
                    header={"Audit Status"}
                    cell={<ArticleAuditStatusCell />}
                    sortable={true}
                />
            </ContentEntryListConfig>
        </Admin>
    );
};
