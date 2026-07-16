import React from "react";
import { Admin, Api } from "webiny/extensions";

/**
 * Background Tasks demo — "Apply Discount" bulk action on Products.
 *
 * Full-stack extension entry point: registers the API-side bulk action (which Webiny
 * runs as a background task) and the Admin-side button + websocket listener.
 */
export const BackgroundTasksDemo = () => {
    return (
        <>
            <Api.Extension
                src={"@/extensions/backgroundTasksDemo/api/ApplyDiscountBulkAction.ts"}
            />
            <Admin.Extension src={"@/extensions/backgroundTasksDemo/admin/Extension.tsx"} />
        </>
    );
};
