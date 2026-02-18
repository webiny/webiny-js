import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";

// You can destructure config components to make the code more readable and easier to work with.
const { Browser } = ContentEntryListConfig;

interface ContactSubmissionTableRow {
    values: {
        emailType: "work" | "personal";
    };
}

export const EmailTypeCell = () => {
    // You can destructure child methods to make the code more readable and easier to work with.
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow<ContactSubmissionTableRow>();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const emailType = row.data.values.emailType;
    return emailType === "work" ? <>{"Business"}</> : <>{"Personal"}</>;
};

const EmailEntryListColumn = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column
                name={"email"}
                path={"values.email"}
                header={"Email"}
                modelIds={["contactSubmission"]}
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

export default EmailEntryListColumn;
