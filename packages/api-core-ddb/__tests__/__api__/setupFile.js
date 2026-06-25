import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createApiCoreDdb } from "~/createApiCoreDdb.js";

setStorageOps("apiCore", () => {
    return {
        storageOperations: createApiCoreDdb(),
        plugins: []
    };
});
