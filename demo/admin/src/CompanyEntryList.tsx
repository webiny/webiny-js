import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { StatusCell } from "./CompanyEntryList/StatusCell";
import { TenantCell } from "./CompanyEntryList/TenantCell";

const { Browser } = ContentEntryListConfig;

export const CompanyEntryList = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column
                name={"status"}
                header={"Status"}
                modelIds={["company"]}
                cell={<StatusCell />}
                after={"name"}
            />
            <Browser.Table.Column
                name={"tenant"}
                header={"Tenant"}
                modelIds={["company"]}
                cell={<TenantCell />}
                before={"actions"}
            />
        </ContentEntryListConfig>
    );
};
