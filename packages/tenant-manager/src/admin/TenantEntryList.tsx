import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { TenantCell } from "./TenantEntryList/TenantCell.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

const { Browser } = ContentEntryListConfig;

export const TenantEntryList = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column
                name={"tenant"}
                header={"Tenant"}
                modelIds={[TENANT_MODEL_ID]}
                cell={<TenantCell />}
                before={"actions"}
            />
        </ContentEntryListConfig>
    );
};
