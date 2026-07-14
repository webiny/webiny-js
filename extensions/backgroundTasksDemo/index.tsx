import React from "react";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
import { ApplyDiscountAction } from "./ApplyDiscountAction.js";

const { Browser } = ContentEntryListConfig;

/**
 * Registers the "Apply Discount" bulk action button in the content entry list.
 * `name` must match the `name` of the backend `ApplyDiscountBulkAction`, and
 * `modelIds` restricts the button to the Products model.
 */
export default () => {
    return (
        <ContentEntryListConfig>
            <Browser.BulkAction
                name={"applyDiscount"}
                element={<ApplyDiscountAction />}
                modelIds={["product"]}
            />
        </ContentEntryListConfig>
    );
};
