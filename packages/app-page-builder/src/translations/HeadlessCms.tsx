import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";

const { Browser } = ContentEntryListConfig;

const CollectionStatus = () => {
    // You can destructure child methods to make the code more readable and easier to work with.
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    return <>{"New"}</>;
};

const TranslationsStats = () => {
    // You can destructure child methods to make the code more readable and easier to work with.
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow();

    // isFolderRow() allows for custom rendering when the current row is a folder.
    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    // TODO: calculate using translation items
    return <>0 / 1</>;
};

export const HeadlessCms = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Table.Column name={"createdBy"} remove />
            <Browser.Table.Column name={"createdOn"} remove />
            <Browser.Table.Column name={"savedOn"} remove />
            <Browser.Table.Column
                name={"collectionId"}
                header={"Collection ID"}
                size={200}
                modelIds={["translationsCollection"]}
                after={"name"}
            />
            <Browser.Table.Column
                name={"status"}
                header={"Status"}
                modelIds={["translationsCollection"]}
                cell={<CollectionStatus />}
            />
            <Browser.Table.Column
                name={"stats"}
                header={"Stats"}
                modelIds={["translationsCollection"]}
                cell={<TranslationsStats />}
                after={"collectionId"}
            />
        </ContentEntryListConfig>
    );
};
