import React from "react";
import { Plugin } from "@webiny/app-admin";

import { ContentEntryListConfig } from "./ContentEntryListConfig";
import { FilterByStatus } from "./filters";

const { Browser } = ContentEntryListConfig;

export const ContentEntriesModule: React.FC = () => {
    return (
        <>
            <Plugin>
                <ContentEntryListConfig>
                    <Browser.Filter name={"status"} element={<FilterByStatus />} />
                </ContentEntryListConfig>
            </Plugin>
        </>
    );
};
