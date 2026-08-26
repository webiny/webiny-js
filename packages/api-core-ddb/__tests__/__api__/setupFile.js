import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { createApiCoreDdb } from "~/createApiCoreDdb.js";

setStorageOps("apiCore", () => {
    const documentClient = getDocumentClient();

    return {
        storageOperations: createApiCoreDdb({ documentClient }),
        plugins: []
    };
});
