import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
import { TenantCell } from "./TenantEntryList/TenantCell.js";
import { HideCompanyPublishActions } from "./TenantEntryList/HidePublishActions.js";

const { Browser } = ContentEntryListConfig;

export const TenantEntryList = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column
                name={"tenant"}
                header={"Tenant"}
                modelIds={["company"]}
                cell={<TenantCell />}
                before={"actions"}
            />
            {/* Hide `status` columns, since we don't want to publish companies. */}
            <Browser.Table.Column name={"status"} modelIds={["company"]} remove />
            {/* Hide all `publish` actions in the UI. */}
            <HideCompanyPublishActions />
        </ContentEntryListConfig>
    );
};
