import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { EmployeeNameCell } from "./CompanyEntryList/EmployeeNameCell";

const { Browser } = ContentEntryListConfig;

export const EmployeeEntryList = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column
                name={"name"}
                modelIds={["employee"]}
                cell={<EmployeeNameCell />}
            />
        </ContentEntryListConfig>
    );
};
