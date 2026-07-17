import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
import { GenerateAiSummaryAction } from "./GenerateAiSummaryAction.js";

const { Browser } = ContentEntryListConfig;

/**
 * Registers the "Generate AI summary" bulk-action button on the Products list.
 * `name` must match the backend `GenerateAiSummaryBulkAction`.
 */
export default () => {
    return (
        <ContentEntryListConfig>
            <Browser.BulkAction
                name={"generateAiSummary"}
                element={<GenerateAiSummaryAction />}
                modelIds={["product"]}
            />
        </ContentEntryListConfig>
    );
};
