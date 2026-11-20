import { createFeature } from "@webiny/feature/api";
import { AcoPgFeature } from "./AcoPgFeature.js";

/**
 * The API extension `<AcoPg />` adds to the project: folder-level permissions from the folder
 * catalog, on the Postgres CMS storage. Its own module, so the API bundle imports only the storage,
 * not the project extension.
 */
export const AcoPgExtension = createFeature({
    name: "AcoPgExtension",
    register(container) {
        AcoPgFeature.register(container);
    }
});
