import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createApiCoreDdb } from "~/createApiCoreDdb.js";

setStorageOps("apiCore", () => {
    const documentClient = getDocumentClient();

    return {
        storageOperations: createApiCoreDdb({ documentClient }),
        plugins: []
    };
});
