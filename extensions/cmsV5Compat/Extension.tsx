import React from "react";
import { Api } from "webiny/extensions";

/**
 * Add `<CmsV5Compat />` to `webiny.config.tsx` to serve the Headless CMS GraphQL API in the
 * v5 shape on `/cms/v5/{manage|read|preview}/{locale?}`.
 */
export const CmsV5Compat = () => {
    return <Api.Extension src={"@/extensions/cmsV5Compat/CmsV5SchemaVariant.ts"} />;
};
