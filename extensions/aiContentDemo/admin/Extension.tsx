import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
import { GenerateAiSummaryAction } from "./GenerateAiSummaryAction.js";
import { AiSummaryGeneratedEventHandler } from "./AiSummaryGeneratedEventHandler.js";

const { Browser } = ContentEntryListConfig;

/**
 * Registers a websocket event handler that toasts when an AI summary is generated
 * (the backend emits `cms.product.aiSummaryGenerated` per processed entry).
 */
const AiContentDemoFeature = createFeature({
    name: "AiContentDemo",
    register(container) {
        container.register(AiSummaryGeneratedEventHandler);
    }
});

/**
 * Registers the "Generate AI summary" bulk-action button on the Products list, plus the
 * websocket listener above. `name` must match the backend `GenerateAiSummaryBulkAction`.
 */
export default () => {
    return (
        <>
            <RegisterFeature feature={AiContentDemoFeature} />
            <ContentEntryListConfig>
                <Browser.BulkAction
                    name={"generateAiSummary"}
                    element={<GenerateAiSummaryAction />}
                    modelIds={["product"]}
                />
            </ContentEntryListConfig>
        </>
    );
};
