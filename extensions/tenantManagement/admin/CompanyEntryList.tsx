import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { TenantCell } from "./CompanyEntryList/TenantCell";
import { HideCompanyPublishActions } from "./CompanyEntryList/HidePublishActions";

const { Browser } = ContentEntryListConfig;

export const CompanyEntryList = () => {
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
