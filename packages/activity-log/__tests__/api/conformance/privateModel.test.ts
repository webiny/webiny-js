import { describeStorageConformance } from "./storageConformance.js";
import { useStorage } from "./useStorage.js";

/**
 * The private-model adapter against the interface contract.
 *
 * This file is the whole cost of adding a second implementation: point the same suite at the new
 * store and the comparison is done. Nothing in `storageConformance.ts` mentions the CMS.
 */
const handler = useStorage();

describeStorageConformance("private CMS model", {
    run: callback => handler.withStorage(callback)
});
