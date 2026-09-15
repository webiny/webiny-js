import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
import { ApplyDiscountAction } from "./ApplyDiscountAction.js";
import { DiscountAppliedEventHandler } from "./DiscountAppliedEventHandler.js";

const { Browser } = ContentEntryListConfig;

/**
 * Registers a websocket event handler that toasts when a product discount is applied
 * (the backend emits `cms.product.discountApplied` per processed entry).
 */
const ApplyDiscountFeature = createFeature({
    name: "BulkActions/ApplyDiscount",
    register(container) {
        container.register(DiscountAppliedEventHandler);
    }
});

/**
 * Registers the "Apply Discount" bulk action button in the content entry list, plus the
 * websocket listener above. `name` must match the backend `ApplyDiscountBulkAction`, and
 * `modelIds` restricts the button to the Products model.
 */
export default () => {
    return (
        <>
            <RegisterFeature feature={ApplyDiscountFeature} />
            <ContentEntryListConfig>
                <Browser.BulkAction
                    name={"applyDiscount"}
                    element={<ApplyDiscountAction />}
                    modelIds={["product"]}
                />
            </ContentEntryListConfig>
        </>
    );
};
