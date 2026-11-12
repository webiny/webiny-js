import { createFeature } from "@webiny/feature/api/index.js";
import { HeadlessCmsPgFeature } from "./HeadlessCmsPgFeature.js";

/**
 * The API extension `<HeadlessCmsPg />` adds to the project: the Postgres CMS storage, on the
 * Postgres SQL storage (`createPgStorage`). Its own module, so the API bundle imports only the
 * storage, not the project extension.
 */
export const HeadlessCmsPgExtension = createFeature({
    name: "HeadlessCmsPgExtension",
    register(container) {
        HeadlessCmsPgFeature.register(container);
    }
});
