import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { ServiceDiscovery } from "packages/api/src/index.js";
import { createApiCoreDdb } from "~/createApiCoreDdb.js";

setStorageOps("apiCore", () => {
    const documentClient = getDocumentClient();

    // Set document client for service discovery, so all tested code uses exactly this client.
    ServiceDiscovery.setDocumentClient(documentClient);

    return {
        storageOperations: createApiCoreDdb({ documentClient }),
        plugins: []
    };
});
