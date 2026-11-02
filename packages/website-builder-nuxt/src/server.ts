/**
 * Nitro server handlers for Website Builder. The Nuxt counterpart of
 * `@webiny/website-builder-nextjs/middleware`.
 *
 * Handles the request-time concerns an app would otherwise hand-write:
 *  - **Preview / editing mode**: routes `?wb.preview`/`?wb.editing` requests through the preview
 *    route, which sets the preview cookie, and disables caching while previewing; exits preview
 *    when the flag is gone.
 *  - **Tenant**: stores `wb.tenant` (default `root`) on `event.context.tenantId`.
 *  - **A/B visitor cookie**: sets a stable, PII-free `wb_ab_vid` cookie so variant bucketing is
 *    deterministic across visits.
 *
 * `h3` comes with Nuxt. It is imported when a handler first runs, so importing this module
 * outside a Nitro server does not load it.
 * Drop into a project as:
 *
 *   // server/middleware/webiny.ts
 *   import { createWebsiteBuilderMiddleware } from "@webiny/website-builder-nuxt/server";
 *   export default defineEventHandler(createWebsiteBuilderMiddleware());
 *
 *   // server/api/preview.get.ts
 *   import { createPreviewHandler } from "@webiny/website-builder-nuxt/server";
 *   export default defineEventHandler(createPreviewHandler());
 */

export { createWebsiteBuilderMiddleware } from "./server/createWebsiteBuilderMiddleware.js";
export type { WebsiteBuilderMiddlewareOptions } from "./server/createWebsiteBuilderMiddleware.js";
export { createPreviewHandler } from "./server/createPreviewHandler.js";
export type { PreviewHandlerOptions } from "./server/createPreviewHandler.js";
