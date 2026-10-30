import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";

const { Browser } = ContentEntryListConfig;

const FolderDropConfirmationExtension = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Folder.DropConfirmation value={true} />
        </ContentEntryListConfig>
    );
};

export default FolderDropConfirmationExtension;
