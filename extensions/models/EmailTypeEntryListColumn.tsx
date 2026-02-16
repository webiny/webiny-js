import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";

// You can destructure config components to make the code more readable and easier to work with.
const { Browser } = ContentEntryListConfig;

export const EmailCell = () => {
    // You can destructure child methods to make the code more readable and easier to work with.
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow<any>();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    return <>{row.data?.values.email}</>;
};

export const EmailTypeCell = () => {
    // You can destructure child methods to make the code more readable and easier to work with.
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow<any>();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const emailType = row.data?.values.emailType;
    console.log(row.data?.values);
    return emailType === "work" ? <>{"Business"}</> : <>{"Personal"}</>;
};

const EmailTypeEntryListColumn = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column
                name={"email"}
                header={"Email"}
                modelIds={["contactSubmission"]}
                cell={<EmailCell />}
                sortable={true}
            />
            <Browser.Table.Column
                name={"emailType"}
                header={"Email Type"}
                modelIds={["contactSubmission"]}
                cell={<EmailTypeCell />}
            />
        </ContentEntryListConfig>
    );
};

export default EmailTypeEntryListColumn;
