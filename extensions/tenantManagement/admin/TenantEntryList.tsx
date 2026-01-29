import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
import { TenantCell } from "./TenantEntryList/TenantCell.js";

const { Browser } = ContentEntryListConfig;

export const TenantEntryList = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column
                name={"tenant"}
                header={"Tenant"}
                modelIds={["tenant"]}
                cell={<TenantCell />}
                before={"actions"}
            />
        </ContentEntryListConfig>
    );
};
