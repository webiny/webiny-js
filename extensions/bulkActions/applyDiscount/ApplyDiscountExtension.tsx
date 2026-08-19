import React from "react";
import { Admin, Api } from "webiny/extensions";

/**
 * "Apply Discount" bulk action on Products.
 *
 * Full-stack extension entry point: registers the API-side bulk action (which Webiny
 * runs as a background task) and the Admin-side button + websocket listener.
 */
export const ApplyDiscountExtension = () => {
    return (
        <>
            <Api.Extension
                src={"@/extensions/bulkActions/applyDiscount/api/ApplyDiscountBulkAction.ts"}
            />
            <Admin.Extension src={"@/extensions/bulkActions/applyDiscount/admin/Extension.tsx"} />
        </>
    );
};
