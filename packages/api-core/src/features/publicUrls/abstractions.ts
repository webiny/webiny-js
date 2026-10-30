import { createAbstraction } from "@webiny/feature/api";
import type { PublicUrl } from "./PublicUrl.js";

export interface IPublicUrls {
    /**
     * Public URL of the API for the current tenant, e.g. https://api.example.com. Uses the custom
     * domain when one is configured. Unknown (see `PublicUrl.isKnown()`) when the deployment doesn't
     * know it.
     */
    getApiUrl(): Promise<PublicUrl>;
    /**
     * Public URL of the Admin app for the current tenant, e.g. https://admin.example.com. Uses the
     * custom domain when one is configured. Unknown when the deployment doesn't know it (e.g. the
     * API is deployed but the Admin app isn't yet).
     */
    getAdminUrl(): Promise<PublicUrl>;
}

/**
 * Public URLs of this deployment's API and Admin app. Each hosting type supplies its own
 * implementation: AWS reads the service manifest written at deploy time
 * (`@webiny/api-event-handler-aws`), standalone reads the `WEBINY_API_URL` / `WEBINY_ADMIN_URL`
 * build params (`@webiny/api-event-handler-standalone`).
 *
 * Resolve per request and don't cache the result globally: values are "for the current tenant".
 */
export const PublicUrls = createAbstraction<IPublicUrls>("Core/PublicUrls");

export namespace PublicUrls {
    export type Interface = IPublicUrls;
}
