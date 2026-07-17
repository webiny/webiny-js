import React from "react";
import { Admin, Api } from "webiny/extensions";

/**
 * AI content demo — "Generate AI summary" bulk action on Products.
 *
 * Full-stack entry point. The API-side bulk action runs as a background task and
 * delegates generation to AI Power Ups (configured provider + optional Writer Persona);
 * the Admin side adds the button. Requires AI Power Ups to be configured (a provider
 * added in its settings), otherwise generation fails with a clear message.
 */
export const AiContentDemo = () => {
    return (
        <>
            <Api.Extension src={"@/extensions/aiContentDemo/api/GenerateAiSummaryBulkAction.ts"} />
            <Admin.Extension src={"@/extensions/aiContentDemo/admin/Extension.tsx"} />
        </>
    );
};
